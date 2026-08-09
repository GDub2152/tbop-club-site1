# Secure Document Vault module

Status: **Beta 1 / Security testing required**

Implemented:
- Private Supabase Storage bucket (`club-vault`)
- Zone-based access enforced in database and Storage RLS
- Executive officer full operational access
- Repeater Trustee scoped technical access
- Member read access to member documents
- Versioned immutable object paths
- SHA-256 file hash metadata
- 5-minute signed download URLs
- Soft-delete/recycle-bin foundation
- Audit logging
- 50 MB browser-upload limit
- File-type allowlist

Not production-cleared yet:
- Recycle-bin listing RPC
- Permanent-delete two-person approval
- Malware scanning
- MFA enforcement verification
- Full role-matrix test completion
- Backup/restore verification
- Retention policy
- End-to-end browser UI acceptance test

Do not upload real confidential documents until the
`DOCUMENT-VAULT-SECURITY-GATE.md` checklist is signed off.
