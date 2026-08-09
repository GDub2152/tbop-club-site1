# TBOP V12 Installation

V12 adds the optional built-in Voting & Elections system.

## 1. Run migration

Supabase > SQL Editor > New query

Open:
`supabase/migrations/v12_optional_voting.sql`

Paste the ENTIRE SQL file into Supabase and click Run.

Expected:
Success. No rows returned.

## 2. Upload V12

Upload the extracted V12 contents over the existing
`tbop-club-site1` GitHub repository.

## 3. Voting starts DISABLED

This is intentional.

Sign in as Administrator or President.

Go to:
Officer Portal > Website Admin

Find:
Member Voting & Elections

Turn the switch ON.

When OFF:
- Member voting navigation is hidden
- Officer voting navigation is hidden
- Voting content is replaced with a disabled message
- Existing election data is preserved
- The club can use paper ballots or another service

When ON:
- Member Voting is available
- Officer Election Builder is available
- Eligible members can see open elections

## 4. Test an election

Officer Portal > Voting

Create an Annual Officer Election.

Add one or two test candidates.

Create it.

It starts as DRAFT.

Click:
Open Voting

Sign in using a separate active/voting-eligible member account.

Member Portal > Voting

Submit the ballot.

Return as admin.

Close Voting.

View Results.

## Security design

The `voter_receipts` table records that a member voted.

The `ballots` table contains the ballot choices but does not contain voter IDs.

Direct ballot submission is not allowed from normal table writes.
Votes are submitted through `public.cast_ballot()`.

## Important

V12 is a strong first production implementation, but before a legally/formally
binding club election, test the workflow with several test accounts first.
