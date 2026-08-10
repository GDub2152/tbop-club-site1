(() => {
  const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function render(docs){
    const box=document.querySelector('#dynamic-documents'); if(!box)return;
    if(!docs.length){ box.innerHTML='<div class="notice">Additional club documents will appear here as they are published.</div>'; return; }
    const groups={}; docs.forEach(d=>(groups[d.category||'Other']??=[]).push(d));
    box.innerHTML=Object.entries(groups).map(([cat,items])=>`<section class="document-group"><div class="doc-category-head"><h2>${esc(cat)}</h2><span>${items.length} document${items.length===1?'':'s'}</span></div>${items.map(d=>`<div class="doc-row"><div><strong>${esc(d.title)}</strong><br><small>${esc(d.description||d.file_name||'PDF document')}</small></div><div><a class="btn primary" href="${esc(d.public_url)}" target="_blank" rel="noopener">Open</a> <a class="btn" href="${esc(d.public_url)}" download>Download</a></div></div>`).join('')}</section>`).join('');
  }
  window.loadPublicDocuments=async function(){
    const url=window.TBOP_SUPABASE_URL,key=window.TBOP_SUPABASE_ANON_KEY;
    if(!url||!key||url.includes('YOUR_SUPABASE')||!window.supabase) return render([]);
    const client=window.supabase.createClient(url,key);
    const {data,error}=await client.from('public_documents').select('title,category,description,file_name,public_url,created_at').eq('published',true).order('category').order('created_at',{ascending:false});
    if(error) return render([]); render(data||[]);
  };
  document.addEventListener('DOMContentLoaded',window.loadPublicDocuments);
})();
