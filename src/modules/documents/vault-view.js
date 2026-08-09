
export function renderVaultShell(root) {
  root.innerHTML = `
    <section class="vault-shell">
      <header class="vault-header">
        <div>
          <span class="vault-kicker">TBOP Secure Document Vault</span>
          <h1>Club Records</h1>
          <p class="vault-warning">
            Beta security test environment — do not upload real confidential club records yet.
          </p>
        </div>
        <div class="vault-actions">
          <button data-vault-action="new-folder">New Folder</button>
          <button data-vault-action="upload">Upload Document</button>
        </div>
      </header>

      <div class="vault-layout">
        <aside>
          <h2>Folders</h2>
          <nav data-vault-folders></nav>
        </aside>
        <main>
          <div class="vault-toolbar">
            <input data-vault-search placeholder="Search current folder">
          </div>
          <div data-vault-documents class="vault-document-grid"></div>
        </main>
      </div>
    </section>
  `;
}

export function renderFolders(target, folders, onOpen) {
  target.innerHTML = folders.map((f) => `
    <button class="vault-folder" data-folder-id="${f.id}">
      <strong>${escapeHtml(f.name)}</strong>
      <small>${escapeHtml(f.security_zone)}</small>
    </button>
  `).join("");

  target.querySelectorAll("[data-folder-id]").forEach((btn) => {
    btn.addEventListener("click", () => onOpen(btn.dataset.folderId));
  });
}

export function renderDocuments(target, docs, { onDownload, onTrash }) {
  target.innerHTML = docs.length ? docs.map((d) => {
    const v = d.vault_document_versions?.[0];
    return `
      <article class="vault-document">
        <span>${escapeHtml(d.security_zone)}</span>
        <h3>${escapeHtml(d.title)}</h3>
        <p>${escapeHtml(d.description || "")}</p>
        <small>Version ${d.current_version}${v?.file_size ? ` • ${formatBytes(v.file_size)}` : ""}</small>
        <div>
          ${v ? `<button data-download="${v.id}">Download</button>` : ""}
          <button data-trash="${d.id}">Move to Trash</button>
        </div>
      </article>
    `;
  }).join("") : `<p>No documents in this folder.</p>`;

  for (const d of docs) {
    const v = d.vault_document_versions?.[0];
    if (v) {
      target.querySelector(`[data-download="${v.id}"]`)?.addEventListener(
        "click", () => onDownload({ ...v, document_id: d.id })
      );
    }
    target.querySelector(`[data-trash="${d.id}"]`)?.addEventListener(
      "click", () => onTrash(d)
    );
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B","KB","MB","GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}
