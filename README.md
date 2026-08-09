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
