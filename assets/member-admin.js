
/* ===== V9 Member / Officer Admin ===== */

const TBOP_OFFICER_ROLES=new Set([
  "president","vice_president","secretary","treasurer",
  "sergeant_at_arms","trustee","repeater_trustee","admin"
]);

function roleLabel(role){
  return (role||"member").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
}
function boolToSelect(v){
  if(v===true)return "true";
  if(v===false)return "false";
  return "";
}
function selectToNullableBool(v){
  if(v==="true")return true;
  if(v==="false")return false;
  return null;
}
function normalizeStatus(v){
  return (v||"pending").toLowerCase();
}

function filteredProfiles(){
  let rows=[...(window.TBOP_DB?.profiles||[])];
  const q=(document.getElementById("memberSearch")?.value||"").trim().toLowerCase();
  const status=document.getElementById("memberStatusFilter")?.value||"";
  const role=document.getElementById("memberRoleFilter")?.value||"";
  const dues=document.getElementById("memberDuesFilter")?.value||"";

  if(q) rows=rows.filter(m=>
    (m.name||"").toLowerCase().includes(q) ||
    (m.call||"").toLowerCase().includes(q) ||
    (m.email||"").toLowerCase().includes(q)
  );
  if(status) rows=rows.filter(m=>normalizeStatus(m.status)===status);
  if(role) rows=rows.filter(m=>m.role===role);
  if(dues) rows=rows.filter(m=>m.dues===dues);
  return rows;
}

function renderMemberAdminTable(){
  if(!dbConfigured())return;
  const body=document.getElementById("memberTable"); if(!body)return;
  const rows=filteredProfiles();

  body.innerHTML=rows.map(m=>`<tr>
    <td>${m.name||""}</td>
    <td>${m.call||""}</td>
    <td><span class="${normalizeStatus(m.status)==="active"?"status-good":normalizeStatus(m.status)==="pending"?"status-warn":"status-muted"}">${m.status||"Pending"}</span></td>
    <td>${m.voting==="yes"?"Eligible":"Not eligible"}</td>
    <td>${m.dues==="paid"?"Paid":m.dues==="family"?"Family":"Unpaid"}</td>
    <td><span class="pill">${roleLabel(m.role)}</span></td>
    <td><button class="button secondary small" onclick="openMemberEditor('${m.id}')">Edit</button></td>
  </tr>`).join("") || `<tr><td colspan="7" class="muted">No members match the current filters.</td></tr>`;

  const all=window.TBOP_DB.profiles;
  setText("activeMemberCount",all.filter(m=>normalizeStatus(m.status)==="active").length);
  setText("eligibleMemberCount",all.filter(m=>normalizeStatus(m.status)==="active"&&m.voting==="yes").length);
  setText("paidMemberCount",all.filter(m=>m.dues==="paid"||m.dues==="family").length);
  setText("officerMemberCount",all.filter(m=>TBOP_OFFICER_ROLES.has(m.role)).length);
}

async function loadFullProfile(id){
  const {data,error}=await window.TBOP.supabase.from("profiles").select("*").eq("id",id).single();
  if(error) throw error;
  return data;
}

async function openMemberEditor(id){
  try{
    const p=await loadFullProfile(id);
    const editor=document.getElementById("memberEditor");
    document.getElementById("editMemberId").value=p.id;
    document.getElementById("memberEditorTitle").textContent=p.display_name||p.email||"Member Profile";
    document.getElementById("editDisplayName").value=p.display_name||"";
    document.getElementById("editCallsign").value=p.callsign||"";
    document.getElementById("editEmail").value=p.email||"";
    document.getElementById("editLicenseClass").value=p.license_class||"";
    document.getElementById("editLicenseExpiration").value=p.license_expiration||"";
    document.getElementById("editJoinedOn").value=p.joined_on||"";
    document.getElementById("editMembershipStatus").value=p.membership_status||"pending";
    document.getElementById("editDuesStatus").value=p.dues_status||"unpaid";
    document.getElementById("editVotingEligible").value=String(Boolean(p.voting_eligible));
    document.getElementById("editRole").value=p.role||"member";
    document.getElementById("editArrlMember").value=boolToSelect(p.arrl_member);
    document.getElementById("editTextingAllowed").value=boolToSelect(p.texting_allowed);
    document.getElementById("editMobilePhone").value=p.mobile_phone||"";
    document.getElementById("editHomePhone").value=p.home_phone||"";
    document.getElementById("editAddress1").value=p.address1||"";
    document.getElementById("editAddress2").value=p.address2||"";
    document.getElementById("editCity").value=p.city||"";
    document.getElementById("editState").value=p.state||"";
    document.getElementById("editZip").value=p.zip_code||"";
    document.getElementById("editMembershipNotes").value=p.membership_notes||"";
    editor.classList.remove("hidden");
    editor.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){
    alert("Could not load member: "+(e.message||e));
  }
}
window.openMemberEditor=openMemberEditor;

function closeMemberEditor(){
  document.getElementById("memberEditor")?.classList.add("hidden");
}

async function saveMemberChanges(){
  const id=document.getElementById("editMemberId").value;
  if(!id)return;
  const btn=document.getElementById("saveMemberBtn");

  const changes={
    display_name:document.getElementById("editDisplayName").value.trim(),
    callsign:document.getElementById("editCallsign").value.trim()||null,
    email:document.getElementById("editEmail").value.trim()||null,
    license_class:document.getElementById("editLicenseClass").value.trim()||null,
    license_expiration:document.getElementById("editLicenseExpiration").value||null,
    joined_on:document.getElementById("editJoinedOn").value||null,
    membership_status:document.getElementById("editMembershipStatus").value,
    dues_status:document.getElementById("editDuesStatus").value,
    voting_eligible:document.getElementById("editVotingEligible").value==="true",
    role:document.getElementById("editRole").value,
    arrl_member:selectToNullableBool(document.getElementById("editArrlMember").value),
    texting_allowed:selectToNullableBool(document.getElementById("editTextingAllowed").value),
    mobile_phone:document.getElementById("editMobilePhone").value.trim()||null,
    home_phone:document.getElementById("editHomePhone").value.trim()||null,
    address1:document.getElementById("editAddress1").value.trim()||null,
    address2:document.getElementById("editAddress2").value.trim()||null,
    city:document.getElementById("editCity").value.trim()||null,
    state:document.getElementById("editState").value.trim()||null,
    zip_code:document.getElementById("editZip").value.trim()||null,
    membership_notes:document.getElementById("editMembershipNotes").value.trim()||null,
    updated_at:new Date().toISOString()
  };

  try{
    if(btn){btn.disabled=true;btn.textContent="Saving…";}
    await window.TBOP.api.updateProfile(id,changes);
    await window.TBOP.api.auditProfileChange(id,"profile_updated",{
      role:changes.role,
      membership_status:changes.membership_status,
      dues_status:changes.dues_status,
      voting_eligible:changes.voting_eligible
    });
    closeMemberEditor();
    await refreshDbModules();
    renderMemberAdminTable();
  }catch(e){
    alert("Could not save member: "+(e.message||e));
  }finally{
    if(btn){btn.disabled=false;btn.textContent="Save Changes";}
  }
}

function printRoster(){
  const rows=filteredProfiles();
  const w=window.open("","_blank","width=1000,height=700");
  if(!w)return;
  const html=`<!doctype html><html><head><title>TBOP Membership Roster</title>
  <style>
  body{font-family:Arial,sans-serif;padding:28px;color:#111}
  h1{margin-bottom:4px}p{margin-top:0;color:#555}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th,td{border:1px solid #bbb;padding:8px;text-align:left;font-size:12px}
  th{background:#eee}
  </style></head><body>
  <h1>The Blowtorch of Parma Amateur Radio Club</h1>
  <p>Membership Roster • ${new Date().toLocaleDateString()}</p>
  <table><thead><tr><th>Name</th><th>Callsign</th><th>Status</th><th>Dues</th><th>Voting</th><th>Role</th></tr></thead>
  <tbody>${rows.map(m=>`<tr><td>${m.name||""}</td><td>${m.call||""}</td><td>${m.status||""}</td><td>${m.dues||""}</td><td>${m.voting==="yes"?"Eligible":"No"}</td><td>${roleLabel(m.role)}</td></tr>`).join("")}</tbody></table>
  </body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(()=>w.print(),250);
}

document.addEventListener("DOMContentLoaded",()=>{
  ["memberSearch","memberStatusFilter","memberRoleFilter","memberDuesFilter"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input",renderMemberAdminTable);
    document.getElementById(id)?.addEventListener("change",renderMemberAdminTable);
  });

  document.getElementById("closeMemberEditor")?.addEventListener("click",closeMemberEditor);
  document.getElementById("cancelMemberBtn")?.addEventListener("click",closeMemberEditor);
  document.getElementById("saveMemberBtn")?.addEventListener("click",saveMemberChanges);
  document.getElementById("printRosterBtn")?.addEventListener("click",printRoster);

  if(dbConfigured()){
    setTimeout(renderMemberAdminTable,700);
  }
});
