
import fs from "node:fs";

const sql = fs.readFileSync(
  new URL("../supabase/migrations/20260808_001_document_vault.sql", import.meta.url),
  "utf8"
);

const required = [
  "public.tbop_is_executive()",
  "'president'::public.club_role",
  "'vice_president'::public.club_role",
  "'secretary'::public.club_role",
  "'treasurer'::public.club_role",
  "'sergeant_at_arms'::public.club_role",
  "public.tbop_can_read_vault_zone",
  "public.tbop_can_write_vault_zone",
  "club-vault",
  "public = false",
  "vault_document_versions",
  "vault_audit_log",
  "vault storage delete admin only",
];

let failed = false;
for (const token of required) {
  if (!sql.includes(token)) {
    console.error("Missing expected security token:", token);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("Vault migration static checks passed.");
