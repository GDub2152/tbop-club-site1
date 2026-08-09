# TBOP CMS 1.0 LTS

Clean modular rebuild of The Blowtorch of Parma Club Management System.

## Status
Architecture foundation / migration scaffold. The current V13 site remains the working reference until this branch reaches release-candidate status.

## Principles
- Supabase Auth + PostgreSQL + private Storage
- Central permission engine
- Executive officers receive full operational administration
- Administrator is the technical/system role
- Private documents never use public Storage URLs
- Every sensitive mutation is auditable
- Migrations are versioned and reversible where practical
- Production data is never stored in GitHub


## 1.0.0-beta.1 — Secure Document Vault foundation

The private Document Vault implementation is now present under
`src/modules/documents/` and
`supabase/migrations/20260808_001_document_vault.sql`.

**Do not upload real confidential documents yet.**

The implementation must first pass:
`docs/DOCUMENT-VAULT-SECURITY-GATE.md`.


## 1.0.0-beta.2 — Document Vault UI

Adds:
- Vault UI page
- Folder navigation
- Drag/drop upload
- Classification
- Local folder search
- Signed downloads
- Version-history browser
- Recycle-bin listing/restore
- Executive audit-log browser
- Beta 2 security test plan

Still **not cleared for confidential production documents**.
