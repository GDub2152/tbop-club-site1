
/*
TBOP Supabase adapter.

This file is safe to commit. It never contains private service-role credentials.
The project URL and anon key are read from window.TBOP_CONFIG.

The site continues to operate in demo/localStorage mode when config.js is absent.
*/

window.TBOP = window.TBOP || {};

(function(){
  const cfg = window.TBOP_CONFIG || {};
  const valid = cfg.SUPABASE_URL &&
                cfg.SUPABASE_ANON_KEY &&
                !cfg.SUPABASE_URL.includes("YOUR-PROJECT") &&
                !cfg.SUPABASE_ANON_KEY.includes("YOUR_PUBLIC");

  window.TBOP.backendConfigured = Boolean(valid);
  window.TBOP.supabase = null;

  if(!valid){
    console.info("TBOP: Supabase is not configured; demo mode remains active.");
    return;
  }

  if(!window.supabase || !window.supabase.createClient){
    console.warn("TBOP: Supabase library not loaded.");
    return;
  }

  window.TBOP.supabase = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
