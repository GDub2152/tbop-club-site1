# Document Vault Production Security Gate

**Current status: NOT CLEARED FOR REAL CLUB DOCUMENTS**

The Vault is not considered production-secure until every required item below
has been tested against the actual Supabase project.

## Storage
- [ ] `club-vault` exists and `public = false`.
- [ ] Anonymous users cannot list, read, upload, update, or delete Vault objects.
- [ ] Signed URLs expire after the configured TTL.
- [ ] Direct object URLs do not expose private files.
- [ ] 50 MB browser upload limit is enforced.
- [ ] Object paths always begin with an approved security zone.

## Role tests
Use separate real test accounts for each role.

- [ ] Member can read `members` documents.
- [ ] Member cannot read `officers`.
- [ ] Member cannot read `financial`.
- [ ] Member cannot read `repeater`.
- [ ] Member cannot upload protected documents.
- [ ] President has full operational Vault access.
- [ ] Vice President has full operational Vault access.
- [ ] Secretary has full operational Vault access.
- [ ] Treasurer has full operational Vault access.
- [ ] Sergeant at Arms has full operational Vault access.
- [ ] Repeater Trustee can read/write `repeater`.
- [ ] Repeater Trustee cannot read `financial`.
- [ ] Trustee access is limited to intended read-only zones.
- [ ] Technical Admin can perform recovery/permanent deletion functions.

## File safety
- [ ] Allowed file types tested.
- [ ] Disallowed file types rejected.
- [ ] Oversized files rejected.
- [ ] SHA-256 is stored for every uploaded version.
- [ ] Upload failure does not leave visible orphan metadata.
- [ ] Duplicate version paths are rejected.

## Versioning
- [ ] Version 1 upload works.
- [ ] Version 2 upload does not overwrite Version 1.
- [ ] Old versions can still be downloaded by authorized users.
- [ ] Current-version metadata updates correctly.

## Recycle bin
- [ ] Soft delete removes document from normal listings.
- [ ] Restore works.
- [ ] Ordinary executives cannot physically delete Storage objects.
- [ ] Permanent delete is restricted to technical Admin.
- [ ] Retention policy is documented before automatic purge is enabled.

## Audit
- [ ] Upload is logged.
- [ ] Download/signed-link generation is logged.
- [ ] Trash is logged.
- [ ] Restore is logged.
- [ ] Audit rows cannot be forged with another actor ID.
- [ ] Executives can review audit events.
- [ ] Members cannot inspect the global audit log.

## Account security
- [ ] MFA is enabled/tested for executive officers.
- [ ] Recovery procedure for the break-glass technical Admin account is written.
- [ ] Session-expiry behavior is tested.
- [ ] Lost/stolen officer device response procedure is written.

## Backup / recovery
- [ ] Database backup contains Vault metadata.
- [ ] Storage objects are included in an independent backup strategy.
- [ ] A test restore has been performed with non-confidential test files.
- [ ] Restore does not weaken RLS or bucket privacy.

## Clearance
Only after every required box is complete should the release be marked:

**PRODUCTION SECURE — REAL CLUB DOCUMENT UPLOADS ALLOWED**
