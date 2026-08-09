# Vault Beta 2 Testing

Status: **TEST FILES ONLY**

## Install
1. Run Beta 1 migration if not already complete.
2. Run `supabase/migrations/20260808_002_document_vault_ui.sql`.
3. Confirm `club-vault` remains private.
4. Deploy the repository and open `vault.html` while signed in.

## UI tests
- [ ] Top-level folders load.
- [ ] New Folder works for authorized executive.
- [ ] Drag/drop upload works with a disposable PDF.
- [ ] Search filters the current folder.
- [ ] Download creates a signed link.
- [ ] Version History opens.
- [ ] Trash removes the document from normal view.
- [ ] Recycle Bin lists the trashed document.
- [ ] Restore returns the document.
- [ ] Audit Log opens for an executive.

## Role tests
Use separate accounts. Do not simply change a role and reuse the same browser session.

- [ ] Member: Member Documents visible.
- [ ] Member: Officer/Financial/Repeater hidden or denied.
- [ ] Member: upload denied.
- [ ] Executive officer: all zones visible/read/write.
- [ ] Repeater Trustee: Repeater Technical read/write.
- [ ] Repeater Trustee: Financial denied.
- [ ] Trustee: only intended read-only zones.

## Classification tests
- [ ] Members Only accessible to member.
- [ ] Executive Only denied to ordinary member.
- [ ] Financial denied to ordinary member and Repeater Trustee.
- [ ] Technical allowed for Repeater Trustee.
- [ ] Confidential denied unless role explicitly authorized.

Do not upload real club records until the full Security Gate is complete.
