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
