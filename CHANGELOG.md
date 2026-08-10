# TBOP Club Site Changelog

## 15.0.0 RC1 — Production Candidate
- Removed demo-login fallback; authentication now fails closed.
- Added secure backend status messaging.
- Cleaned Demo labels from production controls.
- Disabled legacy local-only General Poll creation for launch safety.
- Added production launch checklist and RC release notes.
- Bumped service-worker cache.


## 14.0.4 — Conditions Detail Viewer
- Restored Weather, Solar Conditions, and Band Conditions to the normal homepage card layout.
- Removed the inline expandable/collapsible treatment introduced in 14.0.3.
- Weather, Solar, and Band cards are now clickable.
- Clicking opens a larger modal window without leaving the TBOP site.
- Modal closes with Close, outside click, or Escape.
- Keyboard-accessible Enter/Space activation added.
- Live homepage values are reused in the larger view.


## 14.0.3 — Expandable Conditions
- Weather remains visible with current temperature and expands for detail.
- Solar conditions remain visible with SFI/Kp and expand for detail.
- Band Conditions remains on the homepage and expands to the full band grid.
- Native details/summary controls work without JavaScript.
- Service-worker cache bumped to v14.0.3.


## 14.0.2 — Signup RLS Fix
- Removed browser-side insert into public.profiles during signup.
- Added auth.users trigger that creates the profile server-side.
- Supports Supabase email confirmation with session=null after signup.
- New signup profiles remain member / pending / unpaid / non-voting.
- Bumped service-worker cache to v14.0.2.


## 14.0.1 — Member Signup API Hotfix
- Exported signUpMember to TBOP.api.
- Exported password reset/update helpers to TBOP.api.
- Exported self-profile update and member approval helpers to TBOP.api.
- Bumped service-worker cache to v14.0.1.
- Added new member self-service pages/scripts to cache list.


## 14.0.0 — Member Self-Service & Approval Center
- Public member self-signup with optional callsign.
- New accounts are forced to member/pending/unpaid/non-voting.
- Forgot Password and Reset Password pages.
- Logged-in Change Password.
- Member My Profile editor.
- Callsign reminder for licensed applicants/members.
- Officer Approval Center with pending membership review.
- Approve / Reject membership actions.
- Homepage Become a Member now links to self-service signup.


## 13.2.6 — Repeater Delete Controls
- Added Delete button to Repeater Assets.
- Added Delete button to Maintenance History.
- Added confirmation prompt before deletion.
- Backend delete methods added for repeater_assets and repeater_maintenance.
- Editing form resets automatically if the currently edited record is deleted.


## 13.2.5 — Repeater Management Edit Hotfix
- Repeater Assets now have an Edit button.
- Existing repeater assets can be loaded back into the form and saved.
- Maintenance History now has an Edit button.
- Existing maintenance records can be corrected and saved.
- Both editors include Cancel Edit and return to Add mode after saving.
- Backend update methods added for repeater_assets and repeater_maintenance.


## 13.2.4 — Usability & Editing
- Current-time defaults for empty time inputs.
- Member/Officer profile editing wired to Supabase.
- Email shown in roster.
- Equipment edit/save/cancel workflow.


## 13.2.3 — Audited Stability Release
- Fixed stale service-worker cache version that could serve old site code.
- Expanded cached assets to include split logins, Vault, backend, auth, and operations scripts.
- Standardized public Portal Login wording.
- Updated visible site version.
- Performed JavaScript syntax, file-reference, duplicate-ID, and portal-navigation checks.
- Retains 13.2.2 Full News Reader.


## 13.2.2 — Full News Reader

- Public news cards are now clickable.
- Clicking a card opens the complete announcement in a modal.
- Full body text, title, publish date, pinned state, and summary are shown.
- Keyboard activation and Escape-to-close supported.


## 13.2.1 — News CMS Hotfix

- Fixed `operations.js` syntax error that disabled all News & Announcements buttons.
- No database changes.


## 13.2.0 — News & Announcements CMS

### Added
- One-click Save Draft.
- Edit existing announcements.
- Preview before publishing.
- Publish Now.
- Schedule future publication.
- Unpublish back to Draft.
- Archive and restore to Draft.
- Pin and unpin announcements.
- Search and status/audience filters.
- Public homepage continues to show only public posts whose publish time has arrived.

### Preserved
- W8DRZ/Jim Snell memorial homepage.
- Split Member/Officer login.
- Full Officer Portal.
- Unified executive permissions.
- Secure Document Vault Beta.
- Existing Supabase configuration is not included in this update ZIP.


## 13.1.0 — W8DRZ Legacy Release

### Added
- Featured homepage tribute to Jim Snell, the original W8DRZ and Silent Key.
- Full memorial story displayed beside the TBOP logo.
- Responsive tribute layout for desktop, tablet, and mobile.
- Formal release/rollback documentation.
- Version marker and release checklist.

### Preserved
- Separate Member and Officer login pages.
- Full Officer Portal navigation and modules.
- Unified executive permissions for President, Vice President, Secretary,
  Treasurer, and Sergeant at Arms.
- Secure Document Vault Beta.
- Secretary, Treasurer, Voting, Repeater, Equipment, News, Analytics,
  Approvals, Backup, Calendar, and Membership modules.
- Existing Supabase configuration is intentionally not included in update ZIPs.

### Security note
The Document Vault remains in security-testing status. Real confidential club
documents should not be uploaded until the Vault Security Gate is completed.

## 13.0.x development line
- Supabase authentication/backend integration.
- Member/officer administration.
- Secretary and Treasurer workspaces.
- Optional voting.
- Operations suite.
- Secure Document Vault Beta.
- Split Member/Officer login.
- Unified executive permissions.
