# TBOP 15.0.0 RC1 — Production Candidate

This release focuses on launch safety and stabilization rather than new features.

## Production changes
- Removed insecure demo-login fallback from Member and Officer login.
- Portal access now fails closed if Supabase configuration is unavailable.
- Officer Portal banner reports secure-backend status.
- Removed remaining Demo labels from production-facing Officer Portal controls.
- General Polls are disabled for RC1 because their legacy handler is browser-local; Officer Elections remain available through the secure voting module when Voting is intentionally enabled.
- Service worker cache bumped to `tbop-v15.0.0-rc1`.
- Added a complete production launch checklist.

## Important
`config.js` is intentionally NOT included. Preserve the live working copy.

This RC does not add a new Supabase schema migration. Existing migrations from prior releases still apply.
