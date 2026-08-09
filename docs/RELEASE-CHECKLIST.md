# Release Checklist

- [ ] Database migrations applied in staging
- [ ] RLS tests pass for every role
- [ ] Private Storage files inaccessible anonymously
- [ ] Executive roles match approved permission matrix
- [ ] Admin-only system operations remain restricted
- [ ] Document upload/download/version/recycle tested
- [ ] Backup export verified
- [ ] Mobile layouts checked
- [ ] Chrome/Firefox/Safari/Edge smoke test
- [ ] No secret/service-role keys committed
- [ ] Rollback procedure documented
- [ ] Release notes complete


## Vault Beta 1
- [ ] Run `20260808_001_document_vault.sql` in the test Supabase project.
- [ ] Verify private bucket.
- [ ] Complete Document Vault role test matrix.
- [ ] Verify versioning.
- [ ] Verify signed URLs.
- [ ] Verify audit trail.
- [ ] Verify recycle-bin soft delete and restore.
- [ ] Verify backup of metadata and Storage test objects.
- [ ] Security Gate signed off before real documents are uploaded.
