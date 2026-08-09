# The Blowtorch of Parma - Amateur Radio Club Portal

This package contains a public website starter and an officer-portal front-end prototype.

## Included

- Public home page
- Public club calendar
- Officer dashboard
- Calendar administration
- Meeting / Secretary area
- Membership management prototype
- Document library placeholder
- Treasurer area
- Members voting / election manager prototype
- Repeater Trustee operations area
- Website administration area
- Mobile-friendly layout

## Officer positions represented

- President
- Vice President
- Secretary
- Treasurer
- Sergeant at Arms
- Trustee 1
- Trustee 2
- Trustee 3
- Repeater Trustee

## IMPORTANT SECURITY NOTE

The current portal is a FRONT-END PROTOTYPE.

Demo data is stored in the browser using localStorage. This is convenient for previewing the interface but is NOT secure for real club records.

DO NOT store the following in this version:

- Real member rosters with private personal information
- Passwords
- Bank information
- Financial account data
- Secret ballots
- API keys
- Repeater site passwords or access codes
- Private minutes or restricted documents

Before production use, connect the portal to a real authentication/database layer.

Recommended production architecture:

1. GitHub Pages for the public website
2. A secure backend such as Supabase, Firebase, or a small hosted API/database
3. Authentication with role-based access
4. Google Drive / Microsoft 365 / secure object storage for sensitive documents
5. Database tables for:
   - users
   - officer_roles
   - members
   - events
   - meetings
   - documents
   - votes
   - voter_eligibility
   - ballot_receipts
   - repeater_tasks
   - audit_log

For secret ballots, store voter eligibility separately from ballot choices so administrators can verify who voted without linking a member to a specific vote choice.

## GitHub setup

1. Sign in to GitHub.
2. Click the + icon and choose "New repository".
3. Repository name suggestion:
   tbop-club-site
4. Choose Public if this repository will only contain the public website/front-end code.
5. Add a README if desired.
6. Create the repository.
7. Upload all files from this package.
8. Commit the files.
9. Open Settings > Pages.
10. Under Build and deployment choose:
    Deploy from a branch
11. Select:
    main
    / (root)
12. Save.
13. GitHub will provide the Pages URL after deployment.

## Custom domain later

A custom domain can be added under Settings > Pages > Custom domain.

## Next production step

The next major step should be authentication + database integration. The static GitHub Pages version should remain the public presentation layer, while private data is served only after authenticated API requests.


## V2 redesign
Dark/orange TBOP branding, supplied logo placeholder, homepage dashboard, public events, membership, news, documents, contact, and responsive navigation.


## V3 live data

- Live current weather for ZIP 44135 area via Open-Meteo
- NOAA SWPC F10.7 solar flux and planetary Kp feeds
- Automatic HF qualitative band estimates based on SFI and Kp
- 6m shown as Variable; 2m/70cm shown as Local because these are not reliably inferred from HF solar indices
- Automatic refresh every 10 minutes
- Graceful fallback if a public feed is unavailable

The band labels are estimates, not propagation guarantees.


## V4 calendar + secretary workflow

- Real monthly calendar grid with previous/next/today navigation
- Public events displayed on the calendar
- Demo recurring events: weekly, monthly, yearly
- Expanded Secretary workspace
- Attendance tracking
- Agenda builder
- Motion tracking
- Treasurer / committee / old business / new business / announcements fields
- Generate Minutes button
- Copy generated minutes
- Save meeting drafts to browser localStorage
- Meeting draft archive

All Secretary data remains demo/local-only until the authenticated backend is connected.


## V5 membership + voting

- Added public Membership page
- Added official TBOP membership application PDF to /documents
- Annual dues shown as $25 with $7 additional family members, matching the provided application
- Homepage membership buttons now link to the membership page / PDF
- Membership admin now tracks active status, voting eligibility, and dues status
- Voting dashboard now includes a dedicated officer-election builder
- Officer ballot positions: President, Vice President, Secretary, Treasurer, Sergeant at Arms, Trustee 1, Trustee 2, Trustee 3, Repeater Trustee
- Supports write-in setting and hidden/live result setting in the demo UI

Voting and membership data are still browser-local demo data only and must move to an authenticated backend before real use.


## V6 authentication-ready structure

- New login.html
- New member.html member portal
- Demo role selector for all club roles
- Role-aware officer navigation preview
- Member dashboard, calendar, voting, documents, and profile screens
- Sign-out flow for demo sessions
- Supabase/PostgreSQL starter schema
- Row Level Security starter policies
- Secret-ballot database structure separating voter receipts from ballot choices
- .env.example and .gitignore
- BACKEND-SETUP.md production roadmap

The demo login uses sessionStorage only. It is not a security boundary.


## V7 Supabase connection layer

- Added config.js placeholder
- Added Supabase browser client
- Added backend API adapter
- Added auth routing helper
- Login auto-switches between demo and secure mode
- Real sessions route by database role
- Real sign-out support
- Demo mode remains available until configuration is filled in
- SETUP-CHECKLIST.md added

Do not put service-role credentials or database passwords in browser-accessible files.


## V8 database migration: Events + Membership

V8 begins replacing browser-only localStorage with the real Supabase database.

### Before uploading/using V8
Run this migration in Supabase SQL Editor:

`supabase/migrations/v8_profiles_events_rls.sql`

It adds:
- trusted database role helper functions
- admin profile management policies
- public/member/officer event read policies
- officer event create/update/delete policies
- indexes for events and profile roles

### V8 behavior
- Public calendar reads public events from Supabase
- Homepage upcoming events read Supabase
- Officer Calendar creates/removes database events
- Member Portal reads permitted events
- Officer Membership list reads real `profiles`
- LocalStorage remains as fallback only when Supabase is not configured

### Creating a member
Create the login under Supabase Authentication > Users.
The trigger creates the member profile automatically.
Do not manufacture Auth user IDs from the browser.


## V9 Member & Officer Administration

- Search/filter real member profiles
- Edit callsign, email, license information, address and phones
- Membership status
- Dues status
- Voting eligibility
- Officer/system role assignment
- ARRL/texting fields
- Membership notes
- Printable membership roster
- Audit-log helper for administrator profile changes

Run `supabase/migrations/v9_member_admin.sql` before using V9.


## V10 Secretary Workspace

- Meetings stored in Supabase
- Meeting status workflow
- Agenda items stored in database
- Attendance stored in database
- Motions stored in database
- Treasurer/committee/old/new business fields stored
- Generated minutes stored with the meeting
- Reopen saved meeting drafts
- Meeting archive and status filter
- Delete meetings
- Secretary-specific RLS policies
- Audit logging for meeting saves

Run `supabase/migrations/v10_secretary_workspace.sql` before using V10.


## V11 Treasurer Workspace

- Supabase-backed income/expense ledger
- Member-linked transactions
- Membership dues payment records
- Automatic dues income transaction
- Automatic member dues-status update
- Annual budgets
- Budget vs actual display
- Year/category/type/search filters
- Income/expense/net dashboard totals
- Printable financial report
- Finance-specific RLS
- Financial audit-log helper

Run `supabase/migrations/v11_treasurer.sql` before using V11.


## V12 Optional Voting & Elections

- Voting can be enabled or disabled without deleting data
- President/Admin feature-toggle control
- Disabled voting disappears from Member and Officer navigation
- Officer election builder writes to Supabase
- Election Draft/Open/Closed workflow
- Nine TBOP officer positions supported
- Candidate management
- Write-in voting
- Eligible members only
- One ballot per member per election
- Voter receipt separated from anonymous ballot choices
- Secure ballot RPC
- Results hidden until close unless configured live
- Internal election results view
- Existing data preserved when voting is disabled

Run `supabase/migrations/v12_optional_voting.sql` before using V12.
