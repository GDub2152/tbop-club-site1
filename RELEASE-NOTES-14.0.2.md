# TBOP 14.0.2 — Signup RLS Fix

Fixes:
`new row violates row-level security policy for table "profiles"`

Cause:
With email confirmation enabled, Supabase signUp creates the Auth user but does
not return an authenticated session yet. The 14.0.1 browser then attempted to
insert the matching `public.profiles` row, which RLS correctly rejected.

14.0.2 changes signup to:
1. Send member details as Supabase Auth user metadata.
2. Let a database trigger on `auth.users` create `public.profiles`.
3. Force role/member status defaults server-side.

## Required SQL
Run:
`supabase/migrations/20260809_002_signup_profile_trigger_fix.sql`

The previous 14.0.0 self-service migration should remain installed.

Keep the existing live config.js; it is not included.
