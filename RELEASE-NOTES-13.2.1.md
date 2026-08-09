# TBOP 13.2.1 — News CMS Hotfix

Fixes a JavaScript syntax error in `assets/operations.js` that prevented the Operations module from loading. Because that script failed to parse, the News & Announcements buttons did not receive their event handlers.

No Supabase SQL changes are required. Keep the existing `config.js`.
