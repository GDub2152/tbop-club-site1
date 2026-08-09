# Security Baseline

- RLS enabled on all non-public tables.
- Private Supabase Storage buckets for club records.
- Signed URLs for protected downloads/previews.
- MFA recommended for executive officers and required for technical admin before production documents are uploaded.
- Audit records for sensitive reads/writes where practical.
- Service-role keys never used in browser code.
- Session timeout and re-authentication for destructive actions.
- Recycle-bin retention before permanent deletion.
- Database and document backups kept outside the primary project.
