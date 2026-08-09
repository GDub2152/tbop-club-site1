# TBOP 14.0.1 — Member Signup API Hotfix

Fixes:
`TBOP.api.signUpMember is not a function`

The 14.0.0 backend defined the new member self-service functions but did not
expose them on `window.TBOP.api`.

14.0.1 exports:
- signUpMember
- sendPasswordReset
- updatePassword
- updateMyProfile
- setMemberStatus

The service-worker cache is also bumped to `tbop-v14.0.1` to prevent browsers
from continuing to serve the broken cached backend.

No new SQL is required beyond the 14.0.0 migration:
`supabase/migrations/20260809_001_member_self_service.sql`

Keep the existing live `config.js`; it is not included.
