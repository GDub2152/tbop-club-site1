
import fs from "node:fs";
const sql=fs.readFileSync(new URL("../supabase/migrations/20260808_002_document_vault_ui.sql",import.meta.url),"utf8");
for(const token of ["classification","tbop_vault_list_trash","tbop_vault_list_audit","tbop_vault_search","tbop_can_read_document"]){
  if(!sql.includes(token)){console.error("Missing",token);process.exit(1);}
}
console.log("Vault Beta 2 static checks passed.");
