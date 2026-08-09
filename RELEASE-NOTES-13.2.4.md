# TBOP 13.2.4 — Usability & Editing

- Empty time fields default to current local time on first click/focus.
- Empty datetime-local fields default to current local date/time.
- Member/Officer roster now shows Email and Edit.
- Editing connects to the real Supabase profile and includes name, email,
  callsign, status, dues, voting eligibility, role, license/contact fields and notes.
- Equipment records can now be edited after creation with Save Changes / Cancel.
- No schema migration is required.
- Keep the existing live config.js; it is not included in this package.
