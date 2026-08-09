# TBOP 14.0.0 — Member Self-Service & Approval Center

## Required SQL
Run:
`supabase/migrations/20260809_001_member_self_service.sql`

## Supabase Auth settings
In Supabase Authentication URL configuration, add the site's reset page as an
allowed redirect URL, for example:
`https://gdub2152.github.io/tbop-club-site1/reset-password.html`

New public registrations always receive:
- role = member
- membership_status = pending
- dues_status = unpaid
- voting_eligible = false

Callsign is OPTIONAL. The signup page clearly asks licensed applicants to add
their callsign if they have one.

## New pages
- member-signup.html
- forgot-password.html
- reset-password.html

## Member Portal
Adds My Profile and Change Password.

## Officer Portal
Adds Approval Center for pending membership applications.

Keep the live config.js; it is intentionally excluded from this update package.
