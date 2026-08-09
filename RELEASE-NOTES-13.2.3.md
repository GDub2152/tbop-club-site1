# TBOP 13.2.3 — Audited Stability Release

This release addresses browser caching and consistency issues discovered during
a full static audit of the current package.

Important after deployment:
1. Keep the existing live `config.js`.
2. Wait for GitHub Pages deployment to finish.
3. Hard refresh once with Ctrl+F5.
4. If an older installed PWA still behaves strangely, close it completely and
   reopen it so the new service worker activates.

No new Supabase migration is required for 13.2.3.
