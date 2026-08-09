# TBOP Secure Backend Plan

The current GitHub Pages site is a front-end demo. Real member records, private documents,
financial information, passwords, and ballots must not be stored in the public repository
or browser localStorage.

## Recommended architecture

GitHub Pages:
- Public website
- HTML/CSS/JavaScript
- Public PDFs/images

Supabase:
- Authentication
- PostgreSQL database
- Row Level Security
- Storage buckets for protected documents
- Edge Functions / RPC for sensitive voting operations

## Production login flow

1. User opens login.html.
2. Supabase Auth validates email/password or magic link.
3. The browser receives an authenticated session.
4. The app reads the user's profile/role.
5. Row Level Security decides which database rows the user may access.
6. Browser-side menus hide irrelevant options, but security is enforced by RLS—not by the menu.

## Roles

- member
- president
- vice_president
- secretary
- treasurer
- sergeant_at_arms
- trustee
- repeater_trustee
- admin

## Voting design

Keep voter identity separate from ballot choices.

The `voter_receipts` table records:
- election
- eligible voter
- whether/when they voted

The `ballots` table records:
- election
- office/position
- candidate or write-in
- no voter identity

For production, submit ballots through a database RPC or server/edge function that:
1. confirms authenticated voter eligibility,
2. confirms the voter has not already voted,
3. writes the anonymous ballot,
4. marks the voter receipt,
5. performs these operations atomically.

## Secrets

Safe to expose in public client code:
- Supabase project URL
- Supabase public/anon key, when RLS is correctly configured

Never expose:
- Supabase service-role key
- database password
- email provider credentials
- payment provider secret keys
- private API tokens

## Next implementation steps

1. Create Supabase project.
2. Run `supabase/schema.sql`.
3. Add trusted role-check helper functions and complete RLS policies.
4. Configure Auth.
5. Create private Storage buckets for member/officer documents.
6. Replace demo login/sessionStorage with Supabase Auth.
7. Replace localStorage membership/calendar/voting data with database calls.
8. Test each role using separate test accounts before production.


# V7 connection steps

After creating the Supabase project:

1. Open Supabase Project Settings.
2. Copy the Project URL.
3. Copy the public anon/publishable key.
4. Open `config.js`.
5. Replace:
   - `https://YOUR-PROJECT.supabase.co`
   - `YOUR_PUBLIC_ANON_KEY`
6. Commit `config.js` to GitHub.

Those two values are designed for browser use when Row Level Security is configured correctly.
Never place the service-role key in `config.js`.

The site will detect valid configuration automatically:
- Login page switches from demo login to real email/password login.
- Demo role selector disappears.
- Member/officer page routing reads the user's role from `profiles`.
- Sign out uses Supabase Auth.

The current app still uses localStorage for several modules. This is intentional during migration.
We will move one module at a time to database tables after authentication is working.
