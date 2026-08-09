# Beta 2.5 Installation

1. Upload the Beta 2.5 files over the current site.
2. Keep your existing `config.js`.
3. In Supabase > SQL Editor > New query, run the contents of:

`supabase/migrations/20260808_003_unified_executive_permissions.sql`

4. Sign out and back in after role changes.

No user needs a combined `secretary_admin` or similar role.

Use the real elected role in `public.profiles.role`.
The permission helpers grant executive-level access automatically.
