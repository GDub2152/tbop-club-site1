# Document Vault Operations Notes

## Storage model
Protected content is stored in the private Supabase Storage bucket:
`club-vault`.

Object path:
`<zone>/<folder-id>/<document-id>/v0001/<safe-filename>`

## Zones
- `members`
- `officers`
- `financial`
- `repeater`
- `archive`

## Executive access
President, Vice President, Secretary, Treasurer, Sergeant at Arms, and technical
Admin have full operational access to Vault zones.

## Delete model
Normal deletion is a metadata soft delete. Storage bytes are retained.
Physical deletion is reserved for technical Admin recovery/retention workflows.

## Signed URLs
Downloads use short-lived signed URLs. The default client TTL is five minutes.

## Encryption
Supabase provides encrypted transport (TLS) and platform storage encryption at
rest. The application does not claim client-side end-to-end encryption in Beta 1.

## Malware scanning
Not included in Beta 1. Do not accept untrusted public uploads into this Vault.
