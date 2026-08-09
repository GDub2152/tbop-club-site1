# TBOP Backend Setup Checklist

## GitHub
- [x] Static public site
- [x] Member portal UI
- [x] Officer portal UI
- [x] Supabase adapter
- [x] Database schema
- [x] Demo fallback

## Supabase
- [ ] Create project
- [ ] Run `supabase/schema.sql`
- [ ] Copy Project URL into `config.js`
- [ ] Copy public anon/publishable key into `config.js`
- [ ] Create first administrator user
- [ ] Assign that user's `profiles.role` to `admin`
- [ ] Test login
- [ ] Verify member cannot open officer-only database rows
- [ ] Verify Secretary role access
- [ ] Verify Treasurer role access
- [ ] Verify Repeater Trustee role access

## Migration after login works
- [ ] Events -> database
- [ ] Members -> database
- [ ] Meeting minutes -> database
- [ ] Documents -> protected Storage
- [ ] Elections -> database/RPC
- [ ] Repeater tasks -> database
- [ ] Audit logging
