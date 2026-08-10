
/* ===== V13 Operations Suite ===== */
window.TBOP_OPS={repeaterAssets:[],repeaterMaintenance:[],equipment:[],news:[],approvals:[]};
window.TBOP_NEWS_EDITOR={editingId:null};
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
  if(a)a.innerHTML=TBOP_OPS.repeaterAssets.map(x=>`<article class="event-item">
    <div>
      <span class="pill">${x.asset_type}</span>
      <h3>${x.name}</h3>
      <div class="event-meta">${x.manufacturer||""} ${x.model||""}${x.serial_number?` • SN ${x.serial_number}`:""}${x.location?` • ${x.location}`:""}</div>
      <p>${x.notes||""}</p>
    </div>
    <div class="repeater-item-actions">
      <span class="pill">${x.status}</span>
      <button class="button secondary small" type="button" onclick="editRepeaterAsset('${x.id}')">Edit</button>
      <button class="button danger small" type="button" onclick="deleteRepeaterAssetRecord('${x.id}','${String(x.name||"").replace(/'/g,"&#39;")}')">Delete</button>
    </div>
  </article>`).join("")||`<div class="card"><p>No repeater assets recorded.</p></div>`;

  const m=document.getElementById("repeaterMaintenanceList");
  if(m)m.innerHTML=TBOP_OPS.repeaterMaintenance.map(x=>`<article class="event-item">
    <div>
      <span class="pill">${x.category||"Maintenance"}</span>
      <h3>${x.title}</h3>
      <div class="event-meta">${fmtDate(x.maintenance_date)}${x.performed_by?` • ${x.performed_by}`:""}${x.swr!=null?` • SWR ${x.swr}`:""}${x.forward_power!=null?` • ${x.forward_power} W`:""}${x.firmware_version?` • FW ${x.firmware_version}`:""}</div>
      <p>${x.notes||""}</p>
    </div>
    <div class="repeater-item-actions">
      <button class="button secondary small" type="button" onclick="editRepeaterMaintenance('${x.id}')">Edit</button>
      <button class="button danger small" type="button" onclick="deleteRepeaterMaintenanceRecord('${x.id}','${String(x.title||"").replace(/'/g,"&#39;")}')">Delete</button>
    </div>
  </article>`).join("")||`<div class="card"><p>No maintenance history yet.</p></div>`;
}

async function deleteRepeaterAssetRecord(id,name){
  if(!confirm(`Delete repeater asset "${name}"? This cannot be undone.`))return;
  try{
    await TBOP.api.deleteRepeaterAsset(id);
    if(document.getElementById("repAssetEditId")?.value===id)resetRepeaterAssetEditor();
    await loadOps();
  }catch(err){alert("Could not delete repeater asset: "+(err.message||err))}
}
window.deleteRepeaterAssetRecord=deleteRepeaterAssetRecord;

async function deleteRepeaterMaintenanceRecord(id,title){
  if(!confirm(`Delete maintenance record "${title}"? This cannot be undone.`))return;
  try{
    await TBOP.api.deleteRepeaterMaintenance(id);
    if(document.getElementById("repMaintEditId")?.value===id)resetRepeaterMaintenanceEditor();
    await loadOps();
  }catch(err){alert("Could not delete maintenance record: "+(err.message||err))}
}
window.deleteRepeaterMaintenanceRecord=deleteRepeaterMaintenanceRecord;

function resetRepeaterAssetEditor(){
  document.getElementById("repeaterAssetForm")?.reset();
  const id=document.getElementById("repAssetEditId");if(id)id.value="";
  setText("repAssetSaveBtn","Add Asset");
  document.getElementById("repAssetCancelBtn")?.classList.add("hidden");
}

function editRepeaterAsset(id){
  const x=TBOP_OPS.repeaterAssets.find(a=>a.id===id);if(!x)return;
  const values={
    repAssetEditId:x.id,
    repAssetName:x.name||"",
    repAssetType:x.asset_type||"",
    repManufacturer:x.manufacturer||"",
    repModel:x.model||"",
    repSerial:x.serial_number||"",
    repLocation:x.location||"",
    repStatus:x.status||"active",
    repAssetNotes:x.notes||""
  };
  Object.entries(values).forEach(([id,val])=>{
    const el=document.getElementById(id);if(el)el.value=val;
  });
  setText("repAssetSaveBtn","Save Changes");
  document.getElementById("repAssetCancelBtn")?.classList.remove("hidden");
  document.getElementById("repeaterAssetForm")?.scrollIntoView({behavior:"smooth",block:"start"});
}
window.editRepeaterAsset=editRepeaterAsset;

function resetRepeaterMaintenanceEditor(){
  document.getElementById("repeaterMaintenanceForm")?.reset();
  const id=document.getElementById("repMaintEditId");if(id)id.value="";
  const date=document.getElementById("repMaintDate");if(date)date.value=opsToday();
  setText("repMaintSaveBtn","Add Maintenance");
  document.getElementById("repMaintCancelBtn")?.classList.add("hidden");
}

function editRepeaterMaintenance(id){
  const x=TBOP_OPS.repeaterMaintenance.find(m=>m.id===id);if(!x)return;
  const values={
    repMaintEditId:x.id,
    repMaintDate:x.maintenance_date||opsToday(),
    repMaintTitle:x.title||"",
    repMaintCategory:x.category||"",
    repMaintBy:x.performed_by||"",
    repMaintSWR:x.swr??"",
    repMaintPower:x.forward_power??"",
    repMaintFirmware:x.firmware_version||"",
    repMaintNotes:x.notes||""
  };
  Object.entries(values).forEach(([id,val])=>{
    const el=document.getElementById(id);if(el)el.value=val;
  });
  setText("repMaintSaveBtn","Save Changes");
  document.getElementById("repMaintCancelBtn")?.classList.remove("hidden");
  document.getElementById("repeaterMaintenanceForm")?.scrollIntoView({behavior:"smooth",block:"start"});
}
window.editRepeaterMaintenance=editRepeaterMaintenance;

function renderEquipment(){
  const el=document.getElementById("equipmentList");if(!el)return;
  el.innerHTML=TBOP_OPS.equipment.length?TBOP_OPS.equipment.map(x=>`<article class="event-item">
    <div><span class="pill">${x.category||"Equipment"}</span><h3>${x.name}</h3>
    <div class="event-meta">${x.manufacturer||""} ${x.model||""}${x.asset_tag?` • Tag ${x.asset_tag}`:""}${x.location?` • ${x.location}`:""}</div><p>${x.notes||""}</p></div>
    <div class="equipment-item-actions"><span class="pill">${x.status.replaceAll("_"," ")}</span>
    <button class="button secondary small" type="button" onclick="editEquipment('${x.id}')">Edit</button></div>
  </article>`).join(""):`<div class="card"><p>No equipment recorded.</p></div>`;
}
function resetEquipmentEditor(){
  document.getElementById("equipmentForm")?.reset();
  const id=document.getElementById("eqEditId");if(id)id.value="";
  setText("equipmentSaveBtn","Add Equipment");
  document.getElementById("equipmentCancelEditBtn")?.classList.add("hidden");
}
function editEquipment(id){
  const x=TBOP_OPS.equipment.find(e=>e.id===id);if(!x)return;
  const v={eqEditId:x.id,eqName:x.name||"",eqCategory:x.category||"",eqManufacturer:x.manufacturer||"",eqModel:x.model||"",
    eqSerial:x.serial_number||"",eqTag:x.asset_tag||"",eqLocation:x.location||"",eqStatus:x.status||"available",eqNotes:x.notes||""};
  Object.entries(v).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.value=val});
  setText("equipmentSaveBtn","Save Changes");document.getElementById("equipmentCancelEditBtn")?.classList.remove("hidden");
  document.getElementById("equipmentForm")?.scrollIntoView({behavior:"smooth",block:"start"});
}
window.editEquipment=editEquipment;

function renderNews(){
  const admin=document.getElementById("newsAdminList");
  if(admin){
    const rows=filteredNewsPosts();
    admin.innerHTML=rows.length?rows.map(x=>{
      const status=newsDisplayStatus(x);
      return `<article class="event-item news-admin-item">
        <div class="news-admin-copy">
          <div class="news-card-badges">
            <span class="pill ${status==="published"?"public":status==="draft"?"officers":""}">${newsStatusLabel(status)}</span>
            <span class="pill">${x.visibility}</span>
            ${x.pinned?`<span class="pill public">Pinned</span>`:""}
          </div>
          <h3>${x.title}</h3>
          <div class="event-meta">${newsDateLabel(x)}</div>
          <p>${x.summary||x.body.slice(0,180)}</p>
        </div>
        <div class="news-admin-actions">
          <button class="button secondary small" onclick="editNewsPost('${x.id}')">Edit</button>
          <button class="button secondary small" onclick="previewStoredNews('${x.id}')">Preview</button>
          ${status==="draft"||status==="scheduled"?`<button class="button small" onclick="publishStoredNews('${x.id}')">Publish Now</button>`:""}
          ${status==="published"?`<button class="button secondary small" onclick="unpublishNews('${x.id}')">Unpublish</button>`:""}
          ${status!=="archived"?`<button class="button secondary small" onclick="toggleNewsPin('${x.id}')">${x.pinned?"Unpin":"Pin"}</button>`:""}
          ${status!=="archived"?`<button class="button danger small" onclick="archiveNews('${x.id}')">Archive</button>`:`<button class="button secondary small" onclick="restoreNewsDraft('${x.id}')">Restore to Draft</button>`}
          ${(status==="archived"||status==="draft")?`<button class="button danger small news-delete-permanent" onclick="deleteNewsPermanently('${x.id}')">Delete Permanently</button>`:""}
        </div>
      </article>`;
    }).join(""):`<div class="card"><p>No news posts match the current filters.</p></div>`;
  }

  const pub=document.getElementById("publicNewsList");
  if(pub)pub.innerHTML=TBOP_OPS.news.slice(0,6).map(x=>`<article class="card news-card public-news-card" role="button" tabindex="0" onclick="openPublicNews('${x.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPublicNews('${x.id}')}">
    <span class="pill public">${x.pinned?"Pinned":"News"}</span>
    <h3>${x.title}</h3>
    <p>${x.summary||x.body.slice(0,160)}</p>
    <span class="news-read-more">Read full announcement →</span>
  </article>`).join("")||`<article class="card"><p>No public news yet.</p></article>`;
}
function getNewsById(id){return TBOP_OPS.news.find(x=>x.id===id);}
function resetNewsEditor(){
  TBOP_NEWS_EDITOR.editingId=null;
  const form=document.getElementById("newsForm");if(form)form.reset();
  const id=document.getElementById("newsEditId");if(id)id.value="";
  setText("newsEditorMode","New Post");
  setText("newsEditorTitle","Create News or Announcement");
  setText("newsCurrentStatus","Draft");
}
function fillNewsEditor(post){
  TBOP_NEWS_EDITOR.editingId=post.id;
  document.getElementById("newsEditId").value=post.id;
  document.getElementById("newsTitle").value=post.title||"";
  document.getElementById("newsVisibility").value=post.visibility||"public";
  document.getElementById("newsPinned").checked=Boolean(post.pinned);
  document.getElementById("newsSummary").value=post.summary||"";
  document.getElementById("newsBody").value=post.body||"";
  if(post.publish_at){
    const d=new Date(post.publish_at);
    const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
    document.getElementById("newsPublishAt").value=local;
  }else document.getElementById("newsPublishAt").value="";
  setText("newsEditorMode","Editing");
  setText("newsEditorTitle",post.title||"Edit Post");
  setText("newsCurrentStatus",newsStatusLabel(newsDisplayStatus(post)));
  document.querySelector(".news-editor-card")?.scrollIntoView({behavior:"smooth",block:"start"});
}
function editNewsPost(id){const p=getNewsById(id);if(p)fillNewsEditor(p)}
window.editNewsPost=editNewsPost;

function currentNewsPayload(){
  return {
    title:document.getElementById("newsTitle").value.trim(),
    summary:document.getElementById("newsSummary").value.trim()||null,
    body:document.getElementById("newsBody").value.trim(),
    visibility:document.getElementById("newsVisibility").value,
    pinned:document.getElementById("newsPinned").checked
  };
}
function validateNewsPayload(row){
  if(!row.title)throw new Error("Enter a headline.");
  if(!row.body)throw new Error("Enter the announcement/article text.");
}
async function saveNewsWithState({status,publishAt=null}){
  const row=currentNewsPayload();validateNewsPayload(row);
  row.status=status;
  row.publish_at=publishAt;
  const session=await TBOP.api.getSession();

  if(TBOP_NEWS_EDITOR.editingId){
    await TBOP.api.updateNews(TBOP_NEWS_EDITOR.editingId,row);
  }else{
    row.slug=`${row.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${Date.now()}`;
    row.created_by=session?.user?.id||null;
    const created=await TBOP.api.createNews(row);
    TBOP_NEWS_EDITOR.editingId=created.id;
  }
  await loadOps();
  const refreshed=getNewsById(TBOP_NEWS_EDITOR.editingId);
  if(refreshed)fillNewsEditor(refreshed);
}
async function saveNewsDraft(){
  try{await saveNewsWithState({status:"draft",publishAt:null});alert("Draft saved.");}
  catch(e){alert("Could not save draft: "+(e.message||e))}
}
async function publishNewsNow(){
  try{await saveNewsWithState({status:"published",publishAt:new Date().toISOString()});alert("Published. It is now live for its selected audience.");}
  catch(e){alert("Could not publish: "+(e.message||e))}
}
async function scheduleNews(){
  const raw=document.getElementById("newsPublishAt").value;
  if(!raw){alert("Choose a future publish date and time first.");return;}
  const d=new Date(raw);
  if(d<=new Date()){alert("Scheduled time must be in the future. Use Publish Now for immediate posting.");return;}
  try{
    // Keep DB status as published with a future timestamp. Existing public RLS
    // reveals it automatically only after publish_at is reached.
    await saveNewsWithState({status:"published",publishAt:d.toISOString()});
    alert("Announcement scheduled.");
  }catch(e){alert("Could not schedule: "+(e.message||e))}
}
function previewNewsValues(row){
  const wrap=document.createElement("div");
  wrap.className="news-preview-overlay";
  wrap.innerHTML=`<div class="news-preview-modal">
    <div class="section-head"><div><span class="eyebrow">Preview</span><h2>${row.title||"Untitled"}</h2></div><button class="text-button" data-close-preview>Close</button></div>
    <div class="news-preview-meta">${row.pinned?"📌 Pinned • ":""}${row.visibility||"public"}</div>
    ${row.summary?`<p class="news-preview-summary">${row.summary}</p>`:""}
    <div class="news-preview-body">${String(row.body||"").split(/\n+/).filter(Boolean).map(p=>`<p>${p}</p>`).join("")}</div>
  </div>`;
  document.body.appendChild(wrap);
  wrap.querySelector("[data-close-preview]").addEventListener("click",()=>wrap.remove());
  wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove()});
}
function previewCurrentNews(){
  const row=currentNewsPayload();
  if(!row.title && !row.body){alert("Enter a headline or article text first.");return;}
  previewNewsValues(row);
}
function previewStoredNews(id){const p=getNewsById(id);if(p)previewNewsValues(p)}
window.previewStoredNews=previewStoredNews;

async function publishStoredNews(id){
  try{await TBOP.api.updateNews(id,{status:"published",publish_at:new Date().toISOString()});await loadOps();}
  catch(e){alert("Could not publish: "+(e.message||e))}
}
async function unpublishNews(id){
  if(!confirm("Remove this post from the live site and return it to Draft?"))return;
  try{await TBOP.api.updateNews(id,{status:"draft",publish_at:null});await loadOps();}
  catch(e){alert("Could not unpublish: "+(e.message||e))}
}
async function archiveNews(id){
  if(!confirm("Archive this news post? It will no longer appear live."))return;
  try{await TBOP.api.updateNews(id,{status:"archived",publish_at:null,pinned:false});await loadOps();}
  catch(e){alert("Could not archive: "+(e.message||e))}
}
async function restoreNewsDraft(id){
  try{await TBOP.api.updateNews(id,{status:"draft",publish_at:null});await loadOps();}
  catch(e){alert("Could not restore: "+(e.message||e))}
}
async function deleteNewsPermanently(id){
  const post=getNewsById(id);
  if(!post)return;
  const label=post.title||"this news post";
  if(!confirm(`Permanently delete "${label}"?\n\nThis cannot be undone.`))return;
  if(!confirm("Final confirmation: permanently remove this news/announcement from the database?"))return;
  try{
    await TBOP.api.deleteNews(id);
    if(TBOP_NEWS_EDITOR.editingId===id)resetNewsEditor();
    await loadOps();
    alert("News post permanently deleted.");
  }catch(e){
    alert("Could not delete news post: "+(e.message||e));
  }
}
async function toggleNewsPin(id){
  const p=getNewsById(id);if(!p)return;
  try{await TBOP.api.updateNews(id,{pinned:!p.pinned});await loadOps();}
  catch(e){alert("Could not change pin: "+(e.message||e))}
}
window.publishStoredNews=publishStoredNews;
window.unpublishNews=unpublishNews;
window.archiveNews=archiveNews;
window.restoreNewsDraft=restoreNewsDraft;
window.deleteNewsPermanently=deleteNewsPermanently;
window.toggleNewsPin=toggleNewsPin;

function openPublicNews(id){
  const post=(TBOP_OPS.news||[]).find(x=>x.id===id);
  if(!post)return;

  const overlay=document.createElement("div");
  overlay.className="news-public-overlay";
  overlay.innerHTML=`<div class="news-public-modal">
    <div class="news-public-head">
      <div>
        <div class="news-card-badges">
          <span class="pill public">${post.pinned?"Pinned":"News"}</span>
          <span class="pill">${post.visibility||"public"}</span>
        </div>
        <h2>${escapePublicNews(post.title||"Announcement")}</h2>
        <div class="event-meta">${post.publish_at?`Published ${new Date(post.publish_at).toLocaleString()}`:""}</div>
      </div>
      <button class="text-button" data-close-public-news type="button">Close</button>
    </div>
    ${post.summary?`<p class="news-public-summary">${escapePublicNews(post.summary)}</p>`:""}
    <div class="news-public-body">
      ${String(post.body||"")
        .split(/\n{2,}/)
        .map(p=>p.trim())
        .filter(Boolean)
        .map(p=>`<p>${escapePublicNews(p).replace(/\n/g,"<br>")}</p>`)
        .join("")}
    </div>
  </div>`;

  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");

  const close=()=>{
    overlay.remove();
    document.body.classList.remove("modal-open");
  };
  overlay.querySelector("[data-close-public-news]")?.addEventListener("click",close);
  overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
  const esc=e=>{if(e.key==="Escape"){close();document.removeEventListener("keydown",esc);}};
  document.addEventListener("keydown",esc);
}
window.openPublicNews=openPublicNews;

function escapePublicNews(value){
  const div=document.createElement("div");
  div.textContent=value??"";
  return div.innerHTML;
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
  document.getElementById("repAssetCancelBtn")?.addEventListener("click",resetRepeaterAssetEditor);
  document.getElementById("repMaintCancelBtn")?.addEventListener("click",resetRepeaterMaintenanceEditor);
  document.getElementById("equipmentCancelEditBtn")?.addEventListener("click",resetEquipmentEditor);

  document.getElementById("newsForm")?.addEventListener("submit",e=>e.preventDefault());
  document.getElementById("saveNewsDraftBtn")?.addEventListener("click",saveNewsDraft);
  document.getElementById("previewNewsBtn")?.addEventListener("click",previewCurrentNews);
  document.getElementById("publishNewsBtn")?.addEventListener("click",publishNewsNow);
  document.getElementById("scheduleNewsBtn")?.addEventListener("click",scheduleNews);
  document.getElementById("newNewsPostBtn")?.addEventListener("click",resetNewsEditor);
  ["newsSearch","newsStatusFilter","newsVisibilityFilter"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input",renderNews);
    document.getElementById(id)?.addEventListener("change",renderNews);
  });

  const d=opsToday();
  if(document.getElementById("repMaintDate"))document.getElementById("repMaintDate").value=d;
  document.getElementById("repeaterAssetForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const s=await TBOP.api.getSession();
    const row={
      name:repAssetName.value,
      asset_type:repAssetType.value,
      manufacturer:repManufacturer.value||null,
      model:repModel.value||null,
      serial_number:repSerial.value||null,
      location:repLocation.value||null,
      status:repStatus.value,
      notes:repAssetNotes.value||null
    };
    try{
      const id=document.getElementById("repAssetEditId")?.value;
      if(id)await TBOP.api.updateRepeaterAsset(id,row);
      else{
        row.created_by=s?.user?.id||null;
        await TBOP.api.createRepeaterAsset(row);
      }
      resetRepeaterAssetEditor();
      await loadOps();
    }catch(err){alert("Could not save repeater asset: "+(err.message||err))}
  });
  document.getElementById("repeaterMaintenanceForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const s=await TBOP.api.getSession();
    const row={
      maintenance_date:repMaintDate.value,
      title:repMaintTitle.value,
      category:repMaintCategory.value||null,
      performed_by:repMaintBy.value||null,
      notes:repMaintNotes.value||null,
      swr:repMaintSWR.value?Number(repMaintSWR.value):null,
      forward_power:repMaintPower.value?Number(repMaintPower.value):null,
      firmware_version:repMaintFirmware.value||null
    };
    try{
      const id=document.getElementById("repMaintEditId")?.value;
      if(id)await TBOP.api.updateRepeaterMaintenance(id,row);
      else{
        row.created_by=s?.user?.id||null;
        await TBOP.api.createRepeaterMaintenance(row);
      }
      resetRepeaterMaintenanceEditor();
      await loadOps();
    }catch(err){alert("Could not save maintenance record: "+(err.message||err))}
  });
  document.getElementById("equipmentForm")?.addEventListener("submit",async e=>{
    e.preventDefault();const s=await TBOP.api.getSession();
    const row={name:eqName.value,category:eqCategory.value||null,manufacturer:eqManufacturer.value||null,model:eqModel.value||null,
      serial_number:eqSerial.value||null,asset_tag:eqTag.value||null,location:eqLocation.value||null,status:eqStatus.value,notes:eqNotes.value||null};
    try{
      const id=document.getElementById("eqEditId")?.value;
      if(id)await TBOP.api.updateEquipment(id,row);
      else{row.created_by=s?.user?.id||null;await TBOP.api.createEquipment(row)}
      resetEquipmentEditor();await loadOps();
    }catch(err){alert("Could not save equipment: "+(err.message||err))}
  });
  document.getElementById("approvalForm")?.addEventListener("submit",async e=>{e.preventDefault();const s=await TBOP.api.getSession();await TBOP.api.createApproval({title:approvalTitle.value,approval_type:approvalType.value,status:"pending",requested_by:s?.user?.id||null,requested_at:new Date().toISOString(),notes:approvalNotes.value||null});e.target.reset();await loadOps();});
  document.getElementById("exportDataBtn")?.addEventListener("click",exportData);
  if(opsEnabled())setTimeout(loadOps,1100);
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
});
