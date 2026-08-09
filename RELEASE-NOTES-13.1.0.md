# TBOP Club Site 13.1.0 — W8DRZ Legacy Release

This release places the story of Jim Snell, the original W8DRZ, prominently
beside the club logo on the homepage while keeping the rest of the site and
administrative system intact.

## Deployment
Upload the contents of this release over the existing GitHub repository.

**Do not delete or overwrite your existing `config.js`.**
This release intentionally does not contain `config.js`.

No new Supabase SQL migration is required specifically for the memorial
homepage change. If the unified executive-permissions migration from Beta 2.5
has not yet been run, complete that migration separately.

## Rollback
See `ROLLBACK.md`.

## Document Vault
The Vault is still test-files-only until the security role matrix is completed.
