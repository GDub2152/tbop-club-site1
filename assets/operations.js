
/* ===== V13 Operations Suite ===== */
window.TBOP_OPS={repeaterAssets:[],repeaterMaintenance:[],equipment:[],news:[],approvals:[]};
function opsEnabled(){return Boolean(window.TBOP?.api?.configured())}
function opsToday(){return new Date().toISOString().slice(0,10)}

async function loadOps(){
  if(!opsEnabled())return;
  const jobs=[];
  if(document.getElementById("repeaterAssetList"))jobs.push(window.TBOP.api.listRepeaterAssets().then(x=>TBOP_OPS.repeaterAssets=x||[]));
  if(document.getElementById("repeaterMaintenanceList"))jobs.push(window.TBOP.api.listRepeaterMaintenance().then(x=>TBOP_OPS.repeaterMaintenance=x||[]));
  if(document.getElementById("equipmentList"))jobs.push(window.TBOP.api.listEquipment().then(x=>TBOP_OPS.equipment=x||[]));
  if(document.getElementById("newsAdminList")||document.getElementById("publicNewsList"))jobs.push(window.TBOP.api.listNews(Boolean(document.getElementById("publicNewsList"))).then(x=>TBOP_OPS.news=x||[]));
  if(document.getElementById("approvalList"))jobs.push(window.TBOP.api.listApprovals().then(x=>TBOP_OPS.approvals=x||[]));
  await Promise.allSettled(jobs);
  renderOps();
}

function renderOps(){
  renderRepeaterOps();renderEquipment();renderNews();renderApprovals();renderAnalytics();renderCard();
}

function renderRepeaterOps(){
  setText("repeaterAssetMetric",TBOP_OPS.repeaterAssets.length);
  setText("repeaterMaintMetric",TBOP_OPS.repeaterMaintenance.length);
  const open=(load("repeater")||[]).filter(x=>x.status!=="Completed").length;
  setText("repeaterOpenMetric",open);
  setText("repeaterLastService",TBOP_OPS.repeaterMaintenance[0]?.maintenance_date?fmtDate(TBOP_OPS.repeaterMaintenance[0].maintenance_date):"—");
  const a=document.getElementById("repeaterAssetList");
  if(a)a.innerHTML=TBOP_OPS.repeaterAssets.map(x=>`<article class="event-item"><div><span class="pill">${x.asset_type}</span><h3>${x.name}</h3><div class="event-meta">${x.manufacturer||""} ${x.model||""}${x.location?` • ${x.location}`:""}</div><p>${x.notes||""}</p></div><span class="pill">${x.status}</span></article>`).join("")||`<div class="card"><p>No repeater assets recorded.</p></div>`;
  const m=document.getElementById("repeaterMaintenanceList");
  if(m)m.innerHTML=TBOP_OPS.repeaterMaintenance.map(x=>`<article class="event-item"><div><h3>${x.title}</h3><div class="event-meta">${fmtDate(x.maintenance_date)}${x.performed_by?` • ${x.performed_by}`:""}</div><p>${x.notes||""}</p></div></article>`).join("")||`<div class="card"><p>No maintenance history yet.</p></div>`;
}

function renderEquipment(){
  const el=document.getElementById("equipmentList");if(!el)return;
  el.innerHTML=TBOP_OPS.equipment.map(x=>`<article class="event-item"><div><span class="pill">${x.category||"Equipment"}</span><h3>${x.name}</h3><div class="event-meta">${x.manufacturer||""} ${x.model||""}${x.asset_tag?` • Tag ${x.asset_tag}`:""}</div><p>${x.notes||""}</p></div><span class="pill">${x.status.replaceAll("_"," ")}</span></article>`).join("")||`<div class="card"><p>No equipment recorded.</p></div>`;
}

function renderNews(){
  const admin=document.getElementById("newsAdminList");
  if(admin)admin.innerHTML=TBOP_OPS.news.map(x=>`<article class="event-item"><div><span class="pill">${x.status}</span><h3>${x.title}</h3><p>${x.summary||""}</p></div></article>`).join("")||`<div class="card"><p>No news posts.</p></div>`;
  const pub=document.getElementById("publicNewsList");
  if(pub)pub.innerHTML=TBOP_OPS.news.slice(0,6).map(x=>`<article class="card news-card"><span class="pill public">${x.pinned?"Pinned":"News"}</span><h3>${x.title}</h3><p>${x.summary||x.body.slice(0,160)}</p></article>`).join("")||`<article class="card"><p>No public news yet.</p></article>`;
}

function renderApprovals(){
  const el=document.getElementById("approvalList");if(!el)return;
  el.innerHTML=TBOP_OPS.approvals.map(x=>`<article class="event-item"><div><span class="pill">${x.status}</span><h3>${x.title}</h3><p>${x.notes||""}</p></div><div class="meeting-actions">${x.status==="pending"?`<button class="button small" onclick="decideApproval('${x.id}','approved')">Approve</button><button class="button secondary small" onclick="decideApproval('${x.id}','rejected')">Reject</button>`:""}</div></article>`).join("")||`<div class="card"><p>No approval items.</p></div>`;
}
async function decideApproval(id,status){
  const session=await TBOP.api.getSession();
  await TBOP.api.updateApproval(id,{status,approved_by:session?.user?.id||null,decided_at:new Date().toISOString()});
  await loadOps();
}
window.decideApproval=decideApproval;

function renderAnalytics(){
  setText("analyticsMembers",(TBOP_DB?.profiles||[]).filter(m=>String(m.status).toLowerCase()==="active").length);
  setText("analyticsEvents",(TBOP_DB?.events||[]).length);
  setText("analyticsMeetings",(TBOP_SECRETARY?.meetings||[]).length);
  setText("analyticsEquipment",TBOP_OPS.equipment.length);
  const m=document.getElementById("analyticsMembershipDetail");
  if(m){const all=TBOP_DB?.profiles||[];m.innerHTML=`<div class="stat-row"><span>Voting eligible</span><strong>${all.filter(x=>x.voting==="yes").length}</strong></div><div class="stat-row"><span>Dues paid/family</span><strong>${all.filter(x=>x.dues==="paid"||x.dues==="family").length}</strong></div>`}
  const f=document.getElementById("analyticsFinanceDetail");
  if(f){const tx=TBOP_FINANCE?.transactions||[];const inc=tx.filter(x=>x.transaction_type==="income").reduce((s,x)=>s+Number(x.amount||0),0);const exp=tx.filter(x=>x.transaction_type==="expense").reduce((s,x)=>s+Number(x.amount||0),0);f.innerHTML=`<div class="stat-row"><span>Total income</span><strong>${money(inc)}</strong></div><div class="stat-row"><span>Total expenses</span><strong>${money(exp)}</strong></div>`}
  const o=document.getElementById("analyticsOpsDetail");
  if(o)o.innerHTML=`<div class="stat-row"><span>Repeater assets</span><strong>${TBOP_OPS.repeaterAssets.length}</strong></div><div class="stat-row"><span>Maintenance records</span><strong>${TBOP_OPS.repeaterMaintenance.length}</strong></div>`;
}

async function renderCard(){
  if(!document.getElementById("cardNumber"))return;
  try{
    const user=await TBOP.auth.currentUser();
    if(user){setText("cardMemberName",user.name||"Member");setText("cardCallsign",user.profile?.callsign||"");}
    const card=await TBOP.api.getMyMembershipCard();
    if(card){setText("cardNumber",card.card_number);setText("cardExpires",card.expires_on?fmtDate(card.expires_on):"No expiration");setText("cardQr",String(card.qr_token).slice(0,8).toUpperCase());}
  }catch(e){}
}

async function exportData(){
  try{
    const data=await TBOP.api.exportReadableData();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`tbop-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();
    URL.revokeObjectURL(url);
  }catch(e){alert("Export failed: "+(e.message||e))}
}

document.addEventListener("DOMContentLoaded",()=>{
  const d=opsToday();
  if(document.getElementById("repMaintDate"))document.getElementById("repMaintDate").value=d;
  document.getElementById("repeaterAssetForm")?.addEventListener("submit",async e=>{e.preventDefault();const s=await TBOP.api.getSession();await TBOP.api.createRepeaterAsset({name:repAssetName.value,asset_type:repAssetType.value,manufacturer:repManufacturer.value||null,model:repModel.value||null,serial_number:repSerial.value||null,location:repLocation.value||null,status:repStatus.value,notes:repAssetNotes.value||null,created_by:s?.user?.id||null});e.target.reset();await loadOps();});
  document.getElementById("repeaterMaintenanceForm")?.addEventListener("submit",async e=>{e.preventDefault();const s=await TBOP.api.getSession();await TBOP.api.createRepeaterMaintenance({maintenance_date:repMaintDate.value,title:repMaintTitle.value,category:repMaintCategory.value||null,performed_by:repMaintBy.value||null,notes:repMaintNotes.value||null,swr:repMaintSWR.value?Number(repMaintSWR.value):null,forward_power:repMaintPower.value?Number(repMaintPower.value):null,firmware_version:repMaintFirmware.value||null,created_by:s?.user?.id||null});e.target.reset();repMaintDate.value=d;await loadOps();});
  document.getElementById("equipmentForm")?.addEventListener("submit",async e=>{e.preventDefault();const s=await TBOP.api.getSession();await TBOP.api.createEquipment({name:eqName.value,category:eqCategory.value||null,manufacturer:eqManufacturer.value||null,model:eqModel.value||null,serial_number:eqSerial.value||null,asset_tag:eqTag.value||null,location:eqLocation.value||null,status:eqStatus.value,notes:eqNotes.value||null,created_by:s?.user?.id||null});e.target.reset();await loadOps();});
  document.getElementById("newsForm")?.addEventListener("submit",async e=>{e.preventDefault();const s=await TBOP.api.getSession();const status=newsStatus.value;await TBOP.api.createNews({title:newsTitle.value,slug:`${newsTitle.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${Date.now()}`,summary:newsSummary.value||null,body:newsBody.value,status,visibility:newsVisibility.value,pinned:newsPinned.checked,publish_at:status==="published"?new Date().toISOString():(newsPublishAt.value?new Date(newsPublishAt.value).toISOString():null),created_by:s?.user?.id||null});e.target.reset();await loadOps();});
  document.getElementById("approvalForm")?.addEventListener("submit",async e=>{e.preventDefault();const s=await TBOP.api.getSession();await TBOP.api.createApproval({title:approvalTitle.value,approval_type:approvalType.value,status:"pending",requested_by:s?.user?.id||null,requested_at:new Date().toISOString(),notes:approvalNotes.value||null});e.target.reset();await loadOps();});
  document.getElementById("exportDataBtn")?.addEventListener("click",exportData);
  if(opsEnabled())setTimeout(loadOps,1100);
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
});
