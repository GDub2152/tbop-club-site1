# Vault Beta 2.3 Configuration Fix

Beta 2.2 accidentally included a placeholder `config.js`, which could overwrite
the working GitHub Pages Supabase configuration.

Beta 2.3 deliberately does NOT include `config.js`.

When uploading Beta 2.3 over an existing working TBOP site:
- keep the site's existing `config.js`
- do not delete it
- do not replace it with a placeholder

If Beta 2.2 already overwrote the live file, restore `config.js` with the
Supabase Project URL and public Publishable/Anon key used by the previously
working login.
