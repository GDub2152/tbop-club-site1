(() => {
  const $ = (s) => document.querySelector(s);
  const url = window.TBOP_SUPABASE_URL;
  const key = window.TBOP_SUPABASE_ANON_KEY;
  const configured = url && key && !url.includes('YOUR_SUPABASE') && !key.includes('YOUR_SUPABASE');
  const client = configured && window.supabase ? window.supabase.createClient(url, key) : null;

  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const msg = (text, type='') => { const n=$('#admin-message'); if(!n) return; n.textContent=text; n.className='admin-message '+type; };

  async function adminCheck(user) {
    if (!client || !user) return false;
    const { data, error } = await client.from('site_admins').select('user_id').eq('user_id', user.id).maybeSingle();
    return !error && !!data;
  }

  async function refreshAdminUI() {
    if (!client) {
      $('#admin-login-card')?.classList.remove('hidden');
      msg('Supabase is not configured yet. Add your Project URL and anon key to supabase-config.js.', 'warn');
      return;
    }
    const { data: { session } } = await client.auth.getSession();
    const user = session?.user;
    const isAdmin = await adminCheck(user);
    document.body.classList.toggle('is-admin', isAdmin);
    $('#admin-login-card')?.classList.toggle('hidden', !!user && isAdmin);
    $('#admin-panel')?.classList.toggle('hidden', !isAdmin);
    $('#not-authorized')?.classList.toggle('hidden', !user || isAdmin);
    if ($('#admin-email-display')) $('#admin-email-display').textContent = user?.email || '';
    if (user && !isAdmin) msg('This account is not authorized as a site administrator.', 'error');
    if (isAdmin) { msg('Administrator access active.', 'ok'); loadAdminDocuments(); }
  }

  async function login(e) {
    e.preventDefault();
    if (!client) return refreshAdminUI();
    msg('Signing in…');
    const email=$('#admin-email').value.trim(), password=$('#admin-password').value;
    const { error } = await client.auth.signInWithPassword({email,password});
    if(error) return msg(error.message,'error');
    await refreshAdminUI();
  }

  async function logout() { if(client) await client.auth.signOut(); location.reload(); }

  async function uploadDocument(e) {
    e.preventDefault();
    if(!client) return;
    const title=$('#doc-title').value.trim();
    const category=$('#doc-category').value;
    const description=$('#doc-description').value.trim();
    const file=$('#doc-file').files[0];
    if(!title || !file) return msg('Choose a PDF and enter a title.','error');
    if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return msg('Please upload a PDF file.','error');
    if(file.size > 20*1024*1024) return msg('PDF is larger than the 20 MB site limit.','error');
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
    const path=`${Date.now()}-${safeName}`;
    msg('Uploading document…');
    const { error: upErr }=await client.storage.from('club-documents').upload(path,file,{contentType:'application/pdf',upsert:false});
    if(upErr) return msg(upErr.message,'error');
    const { data: pub }=client.storage.from('club-documents').getPublicUrl(path);
    const { error: dbErr }=await client.from('public_documents').insert({title,category,description,file_name:file.name,storage_path:path,public_url:pub.publicUrl,published:true});
    if(dbErr){ await client.storage.from('club-documents').remove([path]); return msg(dbErr.message,'error'); }
    e.target.reset(); msg('Document published successfully.','ok');
    await Promise.all([loadAdminDocuments(), window.loadPublicDocuments?.()]);
  }

  async function deleteDocument(id,path,title) {
    if(!client || !confirm(`Delete “${title}”? This removes it from the public site.`)) return;
    msg('Deleting document…');
    const { error: sErr }=await client.storage.from('club-documents').remove([path]);
    if(sErr) return msg(sErr.message,'error');
    const { error }=await client.from('public_documents').delete().eq('id',id);
    if(error) return msg(error.message,'error');
    msg('Document deleted.','ok');
    await Promise.all([loadAdminDocuments(), window.loadPublicDocuments?.()]);
  }

  async function loadAdminDocuments(){
    const box=$('#admin-doc-list'); if(!box || !client) return;
    const {data,error}=await client.from('public_documents').select('*').order('created_at',{ascending:false});
    if(error){box.innerHTML='<p class="muted">Unable to load documents.</p>'; return;}
    box.innerHTML=(data||[]).length ? data.map(d=>`<div class="admin-doc-row"><div><strong>${esc(d.title)}</strong><small>${esc(d.category)} · ${esc(d.file_name)}</small></div><button class="btn danger small" data-delete-id="${d.id}" data-path="${esc(d.storage_path)}" data-title="${esc(d.title)}">Delete</button></div>`).join('') : '<p class="muted">No uploaded documents yet.</p>';
    box.querySelectorAll('[data-delete-id]').forEach(b=>b.addEventListener('click',()=>deleteDocument(b.dataset.deleteId,b.dataset.path,b.dataset.title)));
  }

  document.addEventListener('DOMContentLoaded',()=>{
    $('#admin-login-form')?.addEventListener('submit',login);
    document.querySelectorAll('[data-admin-logout]').forEach(b=>b.addEventListener('click',logout));
    $('#document-upload-form')?.addEventListener('submit',uploadDocument);
    refreshAdminUI();
    client?.auth.onAuthStateChange(()=>setTimeout(refreshAdminUI,0));
  });
})();
