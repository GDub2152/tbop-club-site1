
/* ===== V8 database-backed Events + Membership ===== */

window.TBOP_DB = {
  events: [],
  profiles: [],
  loaded: false
};

function dbConfigured(){
  return Boolean(window.TBOP?.api?.configured());
}

function dbEventToUi(e){
  const d=new Date(e.starts_at);
  const localDate=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return {
    id:e.id,
    title:e.title,
    date:localDate.toISOString().slice(0,10),
    time:localDate.toTimeString().slice(0,5),
    location:e.location||"",
    visibility:e.visibility||"public",
    repeat:e.recurrence||"none",
    description:e.description||"",
    _db:true
  };
}

function profileToUi(p){
  return {
    id:p.id,
    name:p.display_name||"",
    call:p.callsign||"",
    email:p.email||"",
    status:(p.membership_status||"pending").replace(/^./,c=>c.toUpperCase()),
    voting:p.voting_eligible?"yes":"no",
    dues:p.dues_status||"unpaid",
    role:p.role||"member",
    license_class:p.license_class||"",
    license_expiration:p.license_expiration||"",
    joined_on:p.joined_on||"",
    _raw:p,
    _db:true
  };
}

async function loadDatabaseEvents(){
  if(!dbConfigured()) return false;
  try{
    const officerPage=Boolean(document.getElementById("adminEvents"));
    const rows=officerPage
      ? await window.TBOP.api.listMyAccessibleEvents()
      : await window.TBOP.api.listPublicEvents();
    window.TBOP_DB.events=(rows||[]).map(dbEventToUi);
    return true;
  }catch(e){
    console.error("TBOP event load failed",e);
    return false;
  }
}

async function loadDatabaseProfiles(){
  if(!dbConfigured() || !document.getElementById("memberTable")) return false;
  try{
    const rows=await window.TBOP.api.listProfiles();
    window.TBOP_DB.profiles=(rows||[]).map(profileToUi);
    return true;
  }catch(e){
    console.error("TBOP profile load failed",e);
    return false;
  }
}

function getUiEvents(){
  return dbConfigured() && window.TBOP_DB.events.length>=0
    ? window.TBOP_DB.events
    : load("events");
}
function getUiProfiles(){
  return dbConfigured() && window.TBOP_DB.profiles.length>=0
    ? window.TBOP_DB.profiles
    : load("members");
}

async function createDatabaseEventFromForm(){
  const date=document.getElementById("eventDate").value;
  const time=document.getElementById("eventTime").value||"00:00";
  const startsAt=new Date(`${date}T${time}:00`).toISOString();
  const session=await window.TBOP.api.getSession();
  return await window.TBOP.api.createEvent({
    title:document.getElementById("eventTitle").value,
    description:document.getElementById("eventDescription").value||null,
    starts_at:startsAt,
    location:document.getElementById("eventLocation").value||null,
    visibility:document.getElementById("eventVisibility").value,
    recurrence:document.getElementById("eventRepeat")?.value||"none",
    created_by:session?.user?.id||null
  });
}

async function refreshDbModules(){
  if(!dbConfigured()) return;
  await Promise.all([loadDatabaseEvents(),loadDatabaseProfiles()]);
  renderAllDb();
}

function renderAllDb(){
  renderPublicDb();
  renderHomeEventsDb();
  renderEventsDb();
  renderMembersDb();
  renderMetricsDb();
  renderMonthCalendarDb();
  renderMemberPortalDb();
}

function renderPublicDb(){
  if(!dbConfigured()) return;
  const events=[...window.TBOP_DB.events].filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date));
  const cal=document.getElementById("publicCalendar");
  if(cal)cal.innerHTML=events.length?events.map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div><span class="pill public">Public</span></article>`).join(""):`<div class="card"><p>No public events are currently scheduled.</p></div>`;
  setText("nextEvent",events[0]?`${fmtDate(events[0].date)} — ${events[0].title}`:"None scheduled");
  setText("eventCount",events.length);
}

function renderHomeEventsDb(){
  if(!dbConfigured()) return;
  const wrap=document.getElementById("homeEvents"); if(!wrap)return;
  const events=[...window.TBOP_DB.events].filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
  wrap.innerHTML=events.length?events.map(e=>`<article class="event-item"><div><span class="pill public">${fmtDate(e.date)}</span><h3>${e.title}</h3><div class="event-meta">${e.time||""}${e.location?(" • "+e.location):""}</div><p>${e.description||""}</p></div></article>`).join(""):`<div class="card"><p>No public events are currently scheduled.</p></div>`;
}

function renderEventsDb(){
  if(!dbConfigured()) return;
  const wrap=document.getElementById("adminEvents"); if(!wrap)return;
  const events=[...window.TBOP_DB.events].sort((a,b)=>a.date.localeCompare(b.date));
  wrap.innerHTML=events.length?events.map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div><div><span class="pill ${e.visibility}">${e.visibility}</span> <button class="button danger small" onclick="deleteDbEvent('${e.id}')">Remove</button></div></article>`).join(""):`<div class="card"><p>No events in the database yet.</p></div>`;
}

async function deleteDbEvent(id){
  if(!confirm("Remove this event?")) return;
  try{
    await window.TBOP.api.deleteEvent(id);
    await refreshDbModules();
  }catch(e){alert("Could not remove event: "+(e.message||e));}
}
window.deleteDbEvent=deleteDbEvent;

function filteredDbMembers(){
  let members=[...window.TBOP_DB.profiles];
  const q=(document.getElementById("memberSearch")?.value||"").trim().toLowerCase();
  const status=document.getElementById("memberStatusFilter")?.value||"";
  const role=document.getElementById("memberRoleFilter")?.value||"";
  const dues=document.getElementById("memberDuesFilter")?.value||"";
  if(q)members=members.filter(m=>(m.name||"").toLowerCase().includes(q)||(m.call||"").toLowerCase().includes(q)||(m.email||"").toLowerCase().includes(q));
  if(status)members=members.filter(m=>m.status.toLowerCase()===status);
  if(role)members=members.filter(m=>m.role===role);
  if(dues)members=members.filter(m=>m.dues===dues);
  return members;
}
function renderMembersDb(){
  if(!dbConfigured())return;
  const body=document.getElementById("memberTable");if(!body)return;
  const all=window.TBOP_DB.profiles,members=filteredDbMembers();
  body.innerHTML=members.length?members.map(m=>`<tr>
    <td>${m.name||""}</td><td>${m.call||""}</td><td>${m.email||""}</td>
    <td><span class="${m.status==="Active"?"status-good":m.status==="Pending"?"status-warn":"status-muted"}">${m.status}</span></td>
    <td>${m.voting==="yes"?"Eligible":"Not eligible"}</td>
    <td>${m.dues==="paid"?"Paid":m.dues==="family"?"Family":"Unpaid"}</td>
    <td><span class="pill">${(m.role||"member").replaceAll("_"," ")}</span></td>
    <td><button class="button secondary small" type="button" onclick="openDbMemberEditor('${m.id}')">Edit</button></td>
  </tr>`).join(""):`<tr><td colspan="8">No members match the current filters.</td></tr>`;
  setText("activeMemberCount",all.filter(m=>m.status==="Active").length);
  setText("eligibleMemberCount",all.filter(m=>m.status==="Active"&&m.voting==="yes").length);
  setText("paidMemberCount",all.filter(m=>m.dues==="paid"||m.dues==="family").length);
  setText("officerMemberCount",all.filter(m=>m.role!=="member").length);
  setText("votingEligibleMetric",all.filter(m=>m.status==="Active"&&m.voting==="yes").length);
}
function boolSelectValue(v){return v===true?"true":v===false?"false":""}
function openDbMemberEditor(id){
  const m=window.TBOP_DB.profiles.find(x=>x.id===id);if(!m)return;const p=m._raw||{};
  const values={
    editMemberId:id,editDisplayName:p.display_name||"",editCallsign:p.callsign||"",editEmail:p.email||"",
    editLicenseClass:p.license_class||"",editLicenseExpiration:p.license_expiration||"",editJoinedOn:p.joined_on||"",
    editMembershipStatus:p.membership_status||"pending",editDuesStatus:p.dues_status||"unpaid",
    editVotingEligible:String(Boolean(p.voting_eligible)),editRole:p.role||"member",
    editArrlMember:boolSelectValue(p.arrl_member),editTextingAllowed:boolSelectValue(p.texting_allowed),
    editMobilePhone:p.mobile_phone||"",editHomePhone:p.home_phone||"",editAddress1:p.address1||"",
    editAddress2:p.address2||"",editCity:p.city||"",editState:p.state||"",editZip:p.zip||"",
    editMembershipNotes:p.membership_notes||""
  };
  Object.entries(values).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v});
  setText("memberEditorTitle",`${p.display_name||"Member"}${p.callsign?` • ${p.callsign}`:""}`);
  const editor=document.getElementById("memberEditor");editor?.classList.remove("hidden");editor?.scrollIntoView({behavior:"smooth",block:"start"});
}
window.openDbMemberEditor=openDbMemberEditor;
function nullableBool(id){const v=document.getElementById(id)?.value;return v==="true"?true:v==="false"?false:null}
async function saveDbMemberEditor(){
  const id=document.getElementById("editMemberId")?.value;if(!id)return;
  const changes={
    display_name:editDisplayName.value.trim(),callsign:editCallsign.value.trim()||null,email:editEmail.value.trim()||null,
    license_class:editLicenseClass.value.trim()||null,license_expiration:editLicenseExpiration.value||null,joined_on:editJoinedOn.value||null,
    membership_status:editMembershipStatus.value,dues_status:editDuesStatus.value,voting_eligible:editVotingEligible.value==="true",
    role:editRole.value,arrl_member:nullableBool("editArrlMember"),texting_allowed:nullableBool("editTextingAllowed"),
    mobile_phone:editMobilePhone.value.trim()||null,home_phone:editHomePhone.value.trim()||null,
    address1:editAddress1.value.trim()||null,address2:editAddress2.value.trim()||null,city:editCity.value.trim()||null,
    state:editState.value.trim()||null,zip:editZip.value.trim()||null,membership_notes:editMembershipNotes.value.trim()||null,
    updated_at:new Date().toISOString()
  };
  if(!changes.display_name){alert("Name is required.");return}
  try{
    await TBOP.api.updateProfile(id,changes);
    try{await TBOP.api.auditProfileChange(id,"profile_updated",{fields:Object.keys(changes)})}catch(_){}
    document.getElementById("memberEditor")?.classList.add("hidden");await refreshDbModules();
  }catch(e){alert("Could not save member: "+(e.message||e))}
}
function closeDbMemberEditor(){document.getElementById("memberEditor")?.classList.add("hidden")}
window.saveDbMemberEditor=saveDbMemberEditor;

function renderMetricsDb(){
  if(!dbConfigured()) return;
  setText("memberMetric",window.TBOP_DB.profiles.filter(m=>m.status==="Active").length);
  setText("eventMetric",window.TBOP_DB.events.length);
}

function expandedDbPublicEvents(){
  const base=window.TBOP_DB.events.filter(e=>e.visibility==="public");
  const expanded=[];
  const start=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);
  const end=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+2,0);
  base.forEach(e=>{
    const d=new Date(e.date+"T12:00:00");
    expanded.push({...e,_date:new Date(d)});
    const repeat=e.repeat||"none";
    if(repeat==="none")return;
    let cur=new Date(d);
    for(let i=0;i<30;i++){
      if(repeat==="weekly")cur=new Date(cur.getFullYear(),cur.getMonth(),cur.getDate()+7);
      if(repeat==="monthly")cur=new Date(cur.getFullYear(),cur.getMonth()+1,cur.getDate());
      if(repeat==="yearly")cur=new Date(cur.getFullYear()+1,cur.getMonth(),cur.getDate());
      if(cur>end)break;
      if(cur>=start)expanded.push({...e,id:String(e.id)+"r"+i,_date:new Date(cur)});
    }
  });
  return expanded;
}

function renderMonthCalendarDb(){
  if(!dbConfigured()) return;
  const grid=document.getElementById("calendarGrid"), title=document.getElementById("calendarTitle");
  if(!grid||!title)return;
  title.textContent=calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const first=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),1);
  const start=new Date(first); start.setDate(1-first.getDay());
  const events=expandedDbPublicEvents();
  const today=new Date();
  let html="";
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const dayEvents=events.filter(e=>sameDay(e._date,d));
    const muted=d.getMonth()!==calendarCursor.getMonth()?" muted-day":"";
    const todayClass=sameDay(d,today)?" today":"";
    html+=`<div class="calendar-day${muted}${todayClass}"><div class="day-number">${d.getDate()}</div><div class="day-events">${dayEvents.slice(0,3).map(e=>`<span class="day-event">${e.title}<small>${e.time||""}</small></span>`).join("")}</div></div>`;
  }
  grid.innerHTML=html;
}

function renderMemberPortalDb(){
  if(!dbConfigured()) return;
  const events=[...window.TBOP_DB.events].sort((a,b)=>a.date.localeCompare(b.date));
  setText("memberEventMetric",events.length);
  const upcoming=document.getElementById("memberUpcomingEvents");
  if(upcoming)upcoming.innerHTML=events.slice(0,3).map(e=>`<div class="mini-list-item"><strong>${e.title}</strong><small>${fmtDate(e.date)}</small></div>`).join("")||"<p class='muted'>No events scheduled.</p>";
  const cal=document.getElementById("memberCalendarList");
  if(cal)cal.innerHTML=events.map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""}${e.location?(" • "+e.location):""}</div><p>${e.description||""}</p></div></article>`).join("")||"<div class='card'><p>No events scheduled.</p></div>";
}

/* Replace event form behavior after original listeners have been installed */
document.addEventListener("DOMContentLoaded",()=>{
  if(!dbConfigured()) return;

  const oldForm=document.getElementById("eventForm");
  if(oldForm){
    const fresh=oldForm.cloneNode(true);
    oldForm.replaceWith(fresh);
    fresh.addEventListener("submit",async e=>{
      e.preventDefault();
      const btn=fresh.querySelector("button[type=submit]");
      try{
        if(btn){btn.disabled=true;btn.textContent="Saving…";}
        await createDatabaseEventFromForm();
        fresh.reset();
        await refreshDbModules();
      }catch(err){
        alert("Could not save event: "+(err.message||err));
      }finally{
        if(btn){btn.disabled=false;btn.textContent="Add Event";}
      }
    });
  }

  /* The profile row must correspond to an Auth user, so don't fabricate UUID users
     from this browser form. Use Supabase Authentication > Users first. */
  const memberForm=document.getElementById("memberForm");
  if(memberForm){
    const submit=memberForm.querySelector("button[type=submit]");
    if(submit){
      submit.type="button";
      submit.addEventListener("click",()=>{
        alert("Create the user's login first in Supabase Authentication → Users. The profile will be created automatically by the new-user trigger. You can then manage status/role from the database-backed member list.");
      });
    }
  }

  refreshDbModules();
});

document.addEventListener("DOMContentLoaded",()=>{
  ["memberSearch","memberStatusFilter","memberRoleFilter","memberDuesFilter"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input",renderMembersDb);
    document.getElementById(id)?.addEventListener("change",renderMembersDb);
  });
  document.getElementById("saveMemberBtn")?.addEventListener("click",saveDbMemberEditor);
  document.getElementById("cancelMemberBtn")?.addEventListener("click",closeDbMemberEditor);
  document.getElementById("closeMemberEditor")?.addEventListener("click",closeDbMemberEditor);
});
