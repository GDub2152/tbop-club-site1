
import { ALLOWED_MIME_PREFIXES, MAX_FILE_BYTES } from "./vault-config.js";

export function safeFilename(name) {
  return String(name || "file")
    .normalize("NFKD")
    .replace(/[^\w.\- ()]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 180);
}

export function versionSegment(n) {
  return `v${String(n).padStart(4, "0")}`;
}

export function buildStoragePath({ zone, folderId, documentId, version, filename }) {
  return [
    zone,
    folderId,
    documentId,
    versionSegment(version),
    safeFilename(filename),
  ].join("/");
}

export function assertAllowedFile(file) {
  if (!file) throw new Error("Select a file.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File exceeds the 50 MB Vault limit.");
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    throw new Error(`File type is not allowed: ${type}`);
  }
}

export async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
