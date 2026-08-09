# Vault Beta 2.2 Repair

This release fixes the Beta 2.1 portal regression.

Beta 2.1 accidentally used the stripped LTS portal shell and replaced the
full V13 Officer Portal.

Beta 2.2 is built from the last known-good V13 application and preserves:
- Dashboard
- Calendar
- Secretary
- Members
- Documents
- Treasurer
- Voting
- Repeater Trustee
- Equipment
- News
- Analytics
- Approvals
- Backup
- Website Admin

It adds:
- Secure Document Vault link in the Officer Portal
- `vault.html`
- Vault Beta 1 and Beta 2 module files/migrations/docs

No additional Supabase SQL is required if both Vault Beta 1 and Beta 2
migrations already ran successfully.

The Vault remains test-files-only until the role matrix is completed.
