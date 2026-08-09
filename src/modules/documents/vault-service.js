
import {
  VAULT_BUCKET,
  SIGNED_URL_TTL_SECONDS,
} from "./vault-config.js";
import {
  assertAllowedFile,
  buildStoragePath,
  sha256Hex,
} from "./vault-utils.js";

export class VaultService {
  constructor(supabaseClient) {
    if (!supabaseClient) throw new Error("Supabase client is required.");
    this.db = supabaseClient;
  }

  async currentUserId() {
    const { data, error } = await this.db.auth.getSession();
    if (error) throw error;
    const id = data.session?.user?.id;
    if (!id) throw new Error("Authentication required.");
    return id;
  }

  async listFolders(parentId = null) {
    let q = this.db
      .from("vault_folders")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order")
      .order("name");

    q = parentId ? q.eq("parent_id", parentId) : q.is("parent_id", null);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async createFolder({ name, securityZone, parentId = null, description = null }) {
    const userId = await this.currentUserId();
    const { data, error } = await this.db
      .from("vault_folders")
      .insert({
        name,
        security_zone: securityZone,
        parent_id: parentId,
        description,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    await this.audit("folder_created", { folderId: data.id, metadata: { name } });
    return data;
  }

  async listDocuments(folderId) {
    const { data, error } = await this.db
      .from("vault_documents")
      .select(`
        *,
        vault_document_versions (
          id, version_number, storage_path, original_filename,
          mime_type, file_size, sha256, version_note, uploaded_at
        )
      `)
      .eq("folder_id", folderId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((doc) => ({
      ...doc,
      vault_document_versions: (doc.vault_document_versions || [])
        .sort((a, b) => b.version_number - a.version_number),
    }));
  }

  async uploadNewDocument({
    folderId,
    securityZone,
    title,
    description = null,
    tags = [],
    classification = "members",
    confidentialRoles = [],
    file,
    versionNote = "Initial version",
  }) {
    assertAllowedFile(file);
    const userId = await this.currentUserId();

    // Create metadata first to obtain a stable document ID.
    const { data: document, error: docError } = await this.db
      .from("vault_documents")
      .insert({
        folder_id: folderId,
        title,
        description,
        security_zone: securityZone,
        tags,
        current_version: 0,
        created_by: userId,
      })
      .select()
      .single();

    if (docError) throw docError;

    try {
      return await this.#uploadVersion({
        document,
        file,
        versionNumber: 1,
        versionNote,
        userId,
      });
    } catch (err) {
      // Metadata cleanup only; storage cleanup is attempted by #uploadVersion.
      await this.db.from("vault_documents").delete().eq("id", document.id);
      throw err;
    }
  }

  async uploadNewVersion(document, file, versionNote = "") {
    assertAllowedFile(file);
    const userId = await this.currentUserId();
    const nextVersion = Number(document.current_version || 0) + 1;
    return this.#uploadVersion({
      document,
      file,
      versionNumber: nextVersion,
      versionNote,
      userId,
    });
  }

  async #uploadVersion({ document, file, versionNumber, versionNote, userId }) {
    const storagePath = buildStoragePath({
      zone: document.security_zone,
      folderId: document.folder_id,
      documentId: document.id,
      version: versionNumber,
      filename: file.name,
    });
    const hash = await sha256Hex(file);

    const upload = await this.db.storage
      .from(VAULT_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      });

    if (upload.error) throw upload.error;

    try {
      const { data: version, error: versionError } = await this.db
        .from("vault_document_versions")
        .insert({
          document_id: document.id,
          version_number: versionNumber,
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          sha256: hash,
          version_note: versionNote || null,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      const { error: updateError } = await this.db
        .from("vault_documents")
        .update({
          current_version: versionNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id);

      if (updateError) throw updateError;

      await this.audit("version_uploaded", {
        documentId: document.id,
        versionId: version.id,
        metadata: {
          version: versionNumber,
          filename: file.name,
          size: file.size,
          sha256: hash,
        },
      });

      return { documentId: document.id, version };
    } catch (err) {
      // Best-effort orphan cleanup if metadata write fails.
      await this.db.storage.from(VAULT_BUCKET).remove([storagePath]);
      throw err;
    }
  }

  async createSignedDownload(version, ttlSeconds = SIGNED_URL_TTL_SECONDS) {
    const { data, error } = await this.db.storage
      .from(VAULT_BUCKET)
      .createSignedUrl(version.storage_path, ttlSeconds, {
        download: version.original_filename,
      });

    if (error) throw error;

    await this.audit("version_downloaded", {
      versionId: version.id,
      documentId: version.document_id || null,
      metadata: { ttl_seconds: ttlSeconds },
    });

    return data.signedUrl;
  }

  async trashDocument(documentId) {
    const { error } = await this.db.rpc("tbop_vault_trash_document", {
      p_document: documentId,
    });
    if (error) throw error;
  }

  async restoreDocument(documentId) {
    const { error } = await this.db.rpc("tbop_vault_restore_document", {
      p_document: documentId,
    });
    if (error) throw error;
  }

  async listTrash() {
    const { data, error } = await this.db.rpc("tbop_vault_list_trash");
    if (error) throw error;
    return data || [];
  }

  async listAudit(documentId = null) {
    const { data, error } = await this.db.rpc("tbop_vault_list_audit", {
      p_document: documentId,
    });
    if (error) throw error;
    return data || [];
  }

  async search(query) {
    const { data, error } = await this.db.rpc("tbop_vault_search", {
      p_query: query || "",
    });
    if (error) throw error;
    return data || [];
  }

  async audit(action, {
    documentId = null,
    versionId = null,
    folderId = null,
    metadata = {},
  } = {}) {
    const { error } = await this.db.rpc("tbop_vault_audit", {
      p_action: action,
      p_document: documentId,
      p_version: versionId,
      p_folder: folderId,
      p_metadata: metadata,
    });
    if (error) throw error;
  }
}
