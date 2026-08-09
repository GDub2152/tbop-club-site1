# TBOP 13.2.6 — Repeater Delete Controls

Repeater Management Center now supports Delete for:
- Repeater Assets
- Maintenance History

Each deletion requires confirmation.

No schema migration is required. The signed-in account must have DELETE RLS
permission on `repeater_assets` and `repeater_maintenance`.

If deletion returns an RLS error, copy the exact message and the Supabase
delete policy can be corrected.

Keep the existing live config.js; it is intentionally excluded.
