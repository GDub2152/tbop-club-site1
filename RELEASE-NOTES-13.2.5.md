# TBOP 13.2.5 — Repeater Management Edit Hotfix

This specifically fixes the Repeater Management Center.

## Repeater Assets
Every asset now has Edit. Selecting it reloads the existing record into the
asset form. The button changes from Add Asset to Save Changes. Cancel Edit
returns the form to add mode.

## Maintenance History
Every maintenance-history entry now has Edit. Date, title, category,
performed-by, SWR, forward power, firmware/version and notes can all be
updated.

## Supabase
No schema migration is required. The signed-in account does need UPDATE RLS
permission on `repeater_assets` and `repeater_maintenance`.

If Save Changes returns an RLS error, copy that exact error and the relevant
update policy can be corrected.

Keep the existing live config.js; it is not included in this ZIP.
