# TBOP V8 Installation

1. In Supabase open SQL Editor.
2. Open `supabase/migrations/v8_profiles_events_rls.sql`.
3. Paste the entire file into a New Query.
4. Run it.
5. Confirm it succeeds.
6. Upload the V8 files over the current GitHub repository.
7. Wait for GitHub Pages to redeploy.
8. Sign in as the administrator.
9. Open Officer Portal > Calendar.
10. Add a test public event.
11. Open the public Calendar page in another browser/device.
12. Confirm the event appears there.

Membership records now come from `public.profiles`.

To add a real member:
- Supabase > Authentication > Users > Add user
- The profile trigger creates their `profiles` row.
- Initially the member is pending/unpaid/not voting eligible.
- Admin management editing is the next module.
