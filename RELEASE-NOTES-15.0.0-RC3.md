# TBOP 15.0.0 RC3 — News Permanent Delete / RLS Fix

This specifically fixes a news card that cannot be removed.

## Required Supabase SQL
Run:
`supabase/migrations/20260809_003_news_delete_policy.sql`

This allows President, Vice President, Secretary, Treasurer, Sergeant at Arms,
and Admin (the `tbop_is_executive()` roles) to permanently delete news posts.

## After deployment
Officer Portal > News > locate the test card > Delete Permanently.

The button is now available even while the post is Published.

The backend now verifies that a row was actually deleted. If RLS still blocks
the operation, the UI will report that instead of falsely reporting success.

No config.js is included.
