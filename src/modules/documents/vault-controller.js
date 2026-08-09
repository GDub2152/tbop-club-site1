
import { VaultService } from "./vault-service.js";
import { renderVaultShell, renderFolders, renderDocuments } from "./vault-view.js";

export class VaultController {
  constructor({ root, supabaseClient, profile }) {
    this.root=root;
    this.profile=profile;
    this.service=new VaultService(supabaseClient);
    this.folders=[];
    this.currentFolder=null;
    this.documents=[];
    this.selectedDocument=null;
  }

  async start() {
    renderVaultShell(this.root);
    this.bindShell();
    await this.refreshFolders();
    await this.showSecurityBanner();
  }

  async showSecurityBanner() {
    const el=this.root.querySelector("[data-vault-security]");
    if(el)el.textContent="BETA 2 — test files only until role matrix is complete.";
  }

  bindShell() {
    this.root.querySelector("[data-vault-search]")?.addEventListener("input", e=>{
      const q=e.target.value.toLowerCase().trim();
      const filtered=this.documents.filter(d=>
        (d.title||"").toLowerCase().includes(q) ||
        (d.description||"").toLowerCase().includes(q) ||
        (d.tags||[]).join(" ").toLowerCase().includes(q)
      );
      this.renderDocs(filtered);
    });

    this.root.querySelector("[data-vault-action='upload']")?.addEventListener("click",()=>this.openUploadDialog());
    this.root.querySelector("[data-vault-action='new-folder']")?.addEventListener("click",()=>this.openNewFolderDialog());
    this.root.querySelector("[data-vault-action='trash']")?.addEventListener("click",()=>this.showTrash());
    this.root.querySelector("[data-vault-action='audit']")?.addEventListener("click",()=>this.showAudit());

    const drop=this.root.querySelector("[data-vault-drop]");
    if(drop){
      ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("dragover")}));
      ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("dragover")}));
      drop.addEventListener("drop",e=>{
        const file=e.dataTransfer.files?.[0];
        if(file)this.openUploadDialog(file);
      });
    }
  }

  async refreshFolders() {
    this.folders=await this.service.listFolders(null);
    renderFolders(this.root.querySelector("[data-vault-folders]"),this.folders,id=>this.openFolder(id));
    if(!this.currentFolder && this.folders[0]) await this.openFolder(this.folders[0].id);
  }

  async openFolder(id) {
    this.currentFolder=this.folders.find(f=>f.id===id) || null;
    this.documents=await this.service.listDocuments(id);
    this.root.querySelector("[data-vault-current-folder]").textContent=this.currentFolder?.name||"Documents";
    this.renderDocs(this.documents);
  }

  renderDocs(docs) {
    renderDocuments(this.root.querySelector("[data-vault-documents]"),docs,{
      onDownload:async version=>{
        const url=await this.service.createSignedDownload(version);
        location.href=url;
      },
      onTrash:async doc=>{
        if(!confirm(`Move "${doc.title}" to the recycle bin?`))return;
        await this.service.trashDocument(doc.id);
        await this.openFolder(this.currentFolder.id);
      },
      onVersions:doc=>this.showVersions(doc),
    });
  }

  openUploadDialog(prefillFile=null) {
    if(!this.currentFolder){alert("Choose a folder first.");return;}
    const modal=this.makeModal("Upload Document",`
      <label>Title<input data-up-title></label>
      <label>Classification
        <select data-up-class>
          <option value="members">Members Only</option>
          <option value="executive">Executive Only</option>
          <option value="financial">Financial</option>
          <option value="technical">Technical</option>
          <option value="confidential">Confidential</option>
        </select>
      </label>
      <label>Description<textarea data-up-desc></textarea></label>
      <label>Tags<input data-up-tags placeholder="minutes, bylaws, repeater"></label>
      <label>Version note<input data-up-note value="Initial version"></label>
      <label>File<input data-up-file type="file"></label>
      <button data-up-submit>Upload</button>
    `);

    const fileInput=modal.querySelector("[data-up-file]");
    if(prefillFile){
      const dt=new DataTransfer();dt.items.add(prefillFile);fileInput.files=dt.files;
      modal.querySelector("[data-up-title]").value=prefillFile.name.replace(/\.[^.]+$/,"");
    }

    modal.querySelector("[data-up-submit]").addEventListener("click",async()=>{
      const file=fileInput.files?.[0];
      const btn=modal.querySelector("[data-up-submit]");
      try{
        btn.disabled=true;btn.textContent="Uploading…";
        await this.service.uploadNewDocument({
          folderId:this.currentFolder.id,
          securityZone:this.currentFolder.security_zone,
          title:modal.querySelector("[data-up-title]").value.trim()||file?.name||"Document",
          description:modal.querySelector("[data-up-desc]").value.trim()||null,
          tags:modal.querySelector("[data-up-tags]").value.split(",").map(x=>x.trim()).filter(Boolean),
          classification:modal.querySelector("[data-up-class]").value,
          file,
          versionNote:modal.querySelector("[data-up-note]").value.trim()||"Initial version",
        });
        modal.remove();await this.openFolder(this.currentFolder.id);
      }catch(e){alert(e.message||e);btn.disabled=false;btn.textContent="Upload";}
    });
  }

  openNewFolderDialog() {
    const modal=this.makeModal("New Folder",`
      <label>Name<input data-f-name></label>
      <label>Security Zone
        <select data-f-zone>
          <option value="members">Members</option>
          <option value="officers">Officers</option>
          <option value="financial">Financial</option>
          <option value="repeater">Repeater</option>
          <option value="archive">Archive</option>
        </select>
      </label>
      <label>Description<textarea data-f-desc></textarea></label>
      <button data-f-submit>Create Folder</button>
    `);
    modal.querySelector("[data-f-submit]").addEventListener("click",async()=>{
      try{
        await this.service.createFolder({
          name:modal.querySelector("[data-f-name]").value.trim(),
          securityZone:modal.querySelector("[data-f-zone]").value,
          description:modal.querySelector("[data-f-desc]").value.trim()||null,
        });
        modal.remove();await this.refreshFolders();
      }catch(e){alert(e.message||e)}
    });
  }

  showVersions(doc) {
    const versions=[...(doc.vault_document_versions||[])].sort((a,b)=>b.version_number-a.version_number);
    const modal=this.makeModal(`Version History — ${doc.title}`,versions.map(v=>`
      <article class="vault-version">
        <strong>Version ${v.version_number}</strong>
        <small>${new Date(v.uploaded_at).toLocaleString()} • ${v.original_filename}</small>
        <p>${v.version_note||""}</p>
        <button data-vdl="${v.id}">Download</button>
      </article>`).join("")||"<p>No versions.</p>");
    versions.forEach(v=>modal.querySelector(`[data-vdl="${v.id}"]`)?.addEventListener("click",async()=>{
      location.href=await this.service.createSignedDownload({...v,document_id:doc.id});
    }));
  }

  async showTrash() {
    try{
      const rows=await this.service.listTrash();
      const modal=this.makeModal("Recycle Bin",rows.map(d=>`
        <article class="vault-version">
          <strong>${d.title}</strong>
          <small>Deleted ${new Date(d.deleted_at).toLocaleString()}</small>
          <button data-restore="${d.id}">Restore</button>
        </article>`).join("")||"<p>Recycle bin is empty.</p>");
      rows.forEach(d=>modal.querySelector(`[data-restore="${d.id}"]`)?.addEventListener("click",async()=>{
        await this.service.restoreDocument(d.id);modal.remove();await this.openFolder(this.currentFolder.id);
      }));
    }catch(e){alert(e.message||e)}
  }

  async showAudit() {
    try{
      const rows=await this.service.listAudit(null);
      this.makeModal("Vault Audit Log",rows.map(a=>`
        <article class="vault-version">
          <strong>${a.action}</strong>
          <small>${new Date(a.occurred_at).toLocaleString()}</small>
          <pre>${JSON.stringify(a.metadata||{},null,2)}</pre>
        </article>`).join("")||"<p>No audit events.</p>");
    }catch(e){alert(e.message||e)}
  }

  makeModal(title,bodyHtml) {
    const wrap=document.createElement("div");
    wrap.className="vault-modal-wrap";
    wrap.innerHTML=`<div class="vault-modal"><header><h2>${title}</h2><button data-close>Close</button></header><div class="vault-modal-body">${bodyHtml}</div></div>`;
    document.body.appendChild(wrap);
    wrap.querySelector("[data-close]").addEventListener("click",()=>wrap.remove());
    return wrap;
  }
}
