# TBOP Rollback Guide

## Fast rollback using the included backup
Before 13.1.0, keep the file:

`TBOP-PRE-13.1.0-BETA-2.5-BACKUP.zip`

To restore:
1. Extract the backup ZIP.
2. Upload its contents over the GitHub repository.
3. Keep the current working `config.js`.
4. Commit the files.
5. Wait for GitHub Pages to redeploy.
6. Hard-refresh the browser.

The 13.1.0 homepage release does not require destructive database changes, so
rolling back the website does not require rolling back Supabase.

## Recommended GitHub rollback point
Before uploading 13.1.0:
1. Open the repository.
2. Create a tag/release named `v13.0-beta2.5`.
3. Deploy 13.1.0.
4. After testing, tag it `v13.1.0`.

If a release must be reversed later, restore the files from the prior tag or
the pre-release backup ZIP.

## Important
Never replace the live `config.js` with an example/placeholder file.
