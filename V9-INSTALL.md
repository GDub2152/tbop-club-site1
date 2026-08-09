# TBOP V9 Installation

## 1. Run the database migration

In Supabase:
- SQL Editor
- New query
- Open `supabase/migrations/v9_member_admin.sql`
- Paste the full file
- Run it

This adds:
- membership application fields to `profiles`
- audit helper for profile changes
- indexes for callsign, dues, and voting status
- tighter self-update behavior

## 2. Upload V9 to GitHub

Upload the extracted contents of `tbop-club-site1-v9.zip`
over the current `tbop-club-site1` repository.

## 3. Test

Sign in as your administrator.

Go to:
Officer Portal > Members

Test:
- Search
- Status filters
- Role filters
- Edit your admin profile
- Add/update callsign
- Change dues / voting status
- Print roster

## Important

Create new login accounts under:
Supabase > Authentication > Users

The new-user trigger automatically creates the corresponding
`public.profiles` record.
