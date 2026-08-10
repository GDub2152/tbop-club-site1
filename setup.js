(() => {
  const $ = s => document.querySelector(s);
  const message = (text,type='') => { const el=$('#setup-message'); el.textContent=text; el.className='admin-message '+type; };
  const values = () => ({url:$('#setup-url').value.trim().replace(/\/$/,''), key:$('#setup-key').value.trim()});
  function validate(url,key){
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) throw new Error('Project URL should look like https://your-project.supabase.co');
    if(!key || key.length < 20) throw new Error('The publishable/anon key appears incomplete.');
    if(/service_role|secret/i.test(key)) throw new Error('Do not use a service-role or secret key. Use the public publishable/anon key.');
  }
  async function test(){
    try{
      const {url,key}=values(); validate(url,key); message('Testing connection…');
      const client=window.supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
      const {error}=await client.from('public_documents').select('id').limit(1);
      if(error && !/relation .* does not exist|Could not find the table/i.test(error.message)) throw error;
      message(error ? 'Connected to Supabase. The document table still needs to be created with supabase-setup.sql.' : 'Connection successful. Supabase is ready.','ok');
    }catch(e){ message(e.message || 'Connection failed.','error'); }
  }
  function download(e){
    e.preventDefault();
    try{
      const {url,key}=values(); validate(url,key);
      const text=`// TBOP Supabase public configuration.\n// Safe for browser use: public Project URL + publishable/anon key only.\n// NEVER place a Supabase service_role or secret key in this file.\nwindow.TBOP_SUPABASE_URL = ${JSON.stringify(url)};\nwindow.TBOP_SUPABASE_ANON_KEY = ${JSON.stringify(key)};\n`;
      const blob=new Blob([text],{type:'text/javascript'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='supabase-config.js'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
      message('Configuration created. Upload the downloaded supabase-config.js to the root of your GitHub site, replacing the placeholder file.','ok');
    }catch(err){ message(err.message,'error'); }
  }
  document.addEventListener('DOMContentLoaded',()=>{ $('#test-connection').addEventListener('click',test); $('#setup-form').addEventListener('submit',download); });
})();
