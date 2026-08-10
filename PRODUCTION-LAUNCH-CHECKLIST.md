# TBOP 15.0.0 RC1 — Production Launch Checklist

## Required before launch
- [ ] Keep the working `config.js` in the GitHub repository.
- [ ] Confirm Supabase Authentication Site URL points to the production TBOP URL.
- [ ] Confirm redirect URLs include member login and reset-password pages.
- [ ] Confirm the 14.0.0 and 14.0.2 member self-service SQL migrations have been run.
- [ ] Configure custom SMTP before inviting a larger number of members, or remain aware of Supabase built-in email limits.
- [ ] Confirm the `club-vault` Storage bucket is PRIVATE.
- [ ] Test with one general-member account and one executive account.

## Public website smoke test
- [ ] Homepage loads without console-visible failures.
- [ ] W8DRZ/Jim Snell tribute displays correctly.
- [ ] Weather, Solar, and Band cards populate.
- [ ] Clicking Weather/Solar/Band opens the larger detail viewer and closes correctly.
- [ ] News cards open full announcements.
- [ ] Calendar displays public events.
- [ ] Membership page and Member Signup open.
- [ ] Mobile layout is readable.

## Member test
- [ ] New member signup works with callsign blank.
- [ ] New member signup works with callsign supplied.
- [ ] Confirmation email returns to TBOP, not localhost.
- [ ] Member Login works.
- [ ] My Profile updates permitted personal fields.
- [ ] Member cannot change role, dues, voting eligibility, or membership status.
- [ ] Forgot Password and Reset Password work.
- [ ] Change Password works inside Member Portal.
- [ ] Member cannot open Officer Portal.

## Officer test
- [ ] Executive login works.
- [ ] Calendar create/edit works.
- [ ] News Draft -> Preview -> Publish works.
- [ ] Member/Officer editing works.
- [ ] Pending membership approval works.
- [ ] Equipment Add/Edit works.
- [ ] Repeater Assets Add/Edit/Delete works.
- [ ] Maintenance History Add/Edit/Delete works.
- [ ] Secretary/Treasurer writes work.
- [ ] Vault test upload/download/restore works with NON-CONFIDENTIAL test files first.

## Production safety
- [ ] Temporarily break `config.js` and confirm Member/Officer login FAILS CLOSED (no demo portal access).
- [ ] Restore `config.js`.
- [ ] Voting remains disabled unless the club intentionally enables it.
- [ ] General Poll form remains disabled in RC1.
- [ ] Ctrl+F5 once after deployment to activate the new service worker.

When all required checks pass, tag the exact files as `v15.0.0`.
