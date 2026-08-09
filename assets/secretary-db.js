
/* ===== V10 Secretary database workspace ===== */
window.TBOP_SECRETARY = {
  currentMeetingId:null,
  meetings:[]
};

function secretaryDbEnabled(){
  return Boolean(window.TBOP?.api?.configured());
}

function secretaryField(id){return document.getElementById(id)?.value?.trim()||""}

function statusLabel(s){
  return (s||"draft").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
}

async function loadMeetingArchiveDb(){
  if(!secretaryDbEnabled() || !document.getElementById("meetingArchive")) return;
  try{
    window.TBOP_SECRETARY.meetings=await window.TBOP.api.listMeetings()||[];
    renderMeetingArchiveDb();
  }catch(e){
    console.error(e);
    document.getElementById("meetingArchive").innerHTML=`<div class="card"><p>Could not load meetings: ${e.message||e}</p></div>`;
  }
}

function renderMeetingArchiveDb(){
  const wrap=document.getElementById("meetingArchive"); if(!wrap)return;
  const filter=document.getElementById("meetingStatusFilter")?.value||"";
  const rows=window.TBOP_SECRETARY.meetings.filter(m=>!filter||m.status===filter);
  wrap.innerHTML=rows.length?rows.map(m=>`
    <article class="event-item">
      <div>
        <span class="pill">${statusLabel(m.status)}</span>
        <h3>${m.title}</h3>
        <div class="event-meta">${m.meeting_date?fmtDate(m.meeting_date):"No date"}${m.location?(" • "+m.location):""}</div>
        <p>${m.secretary?("Secretary: "+m.secretary):"No secretary recorded"}</p>
      </div>
      <div class="meeting-actions">
        <button class="button secondary small" onclick="openMeetingDb('${m.id}')">Open</button>
        <button class="button danger small" onclick="deleteMeetingDb('${m.id}')">Delete</button>
      </div>
    </article>`).join("") : `<div class="card"><p>No meetings found.</p></div>`;
}

async function openMeetingDb(id){
  try{
    const m=await window.TBOP.api.getMeeting(id);
    window.TBOP_SECRETARY.currentMeetingId=id;

    document.getElementById("meetingTitle").value=m.title||"";
    document.getElementById("meetingDate").value=m.meeting_date||"";
    document.getElementById("meetingTime").value=(m.meeting_time||"").slice(0,5);
    document.getElementById("meetingLocation").value=m.location||"";
    document.getElementById("meetingStatus").value=m.status||"draft";
    document.getElementById("presidingOfficer").value=m.presiding_officer||"";
    document.getElementById("secretaryName").value=m.secretary||"";
    document.getElementById("treasurerReport").value=m.treasurer_report||"";
    document.getElementById("committeeReports").value=m.committee_reports||"";
    document.getElementById("oldBusiness").value=m.old_business||"";
    document.getElementById("newBusiness").value=m.new_business||"";
    document.getElementById("announcements").value=m.announcements||"";
    document.getElementById("adjournTime").value=(m.adjourn_time||"").slice(0,5);

    meetingDraft.attendance=(m.attendance||[]).map(x=>x.display_name);
    meetingDraft.agenda=(m.agenda||[]).map(x=>x.item_text);
    meetingDraft.motions=(m.motions||[]).map(x=>({
      text:x.motion_text,
      by:x.moved_by||"",
      second:x.seconded_by||"",
      result:x.result||"Passed"
    }));
    renderSecretaryLists();
    const preview=document.getElementById("minutesPreview");
    if(preview) preview.textContent=m.minutes_text||generateMinutes();
    document.getElementById("view-meetings")?.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){
    alert("Could not open meeting: "+(e.message||e));
  }
}
window.openMeetingDb=openMeetingDb;

async function deleteMeetingDb(id){
  if(!confirm("Delete this meeting and its agenda, attendance, and motions?"))return;
  try{
    await window.TBOP.api.deleteMeeting(id);
    if(window.TBOP_SECRETARY.currentMeetingId===id)resetMeetingDraftDb();
    await loadMeetingArchiveDb();
  }catch(e){
    alert("Could not delete meeting: "+(e.message||e));
  }
}
window.deleteMeetingDb=deleteMeetingDb;

function meetingPayload(){
  return {
    title:secretaryField("meetingTitle")||"Club Meeting",
    meeting_date:secretaryField("meetingDate"),
    meeting_time:secretaryField("meetingTime")||null,
    location:secretaryField("meetingLocation")||null,
    presiding_officer:secretaryField("presidingOfficer")||null,
    secretary:secretaryField("secretaryName")||null,
    status:document.getElementById("meetingStatus")?.value||"draft",
    treasurer_report:secretaryField("treasurerReport")||null,
    committee_reports:secretaryField("committeeReports")||null,
    old_business:secretaryField("oldBusiness")||null,
    new_business:secretaryField("newBusiness")||null,
    announcements:secretaryField("announcements")||null,
    adjourn_time:secretaryField("adjournTime")||null,
    minutes_text:generateMinutes(),
    updated_at:new Date().toISOString()
  };
}

async function saveMeetingDb(){
  if(!secretaryDbEnabled()) return saveMeetingDraft();
  const btn=document.getElementById("saveMeetingBtn");
  const payload=meetingPayload();
  if(!payload.meeting_date){
    alert("Please enter the meeting date.");
    return;
  }
  try{
    if(btn){btn.disabled=true;btn.textContent="Saving…";}
    let meeting;
    if(window.TBOP_SECRETARY.currentMeetingId){
      meeting=await window.TBOP.api.updateMeeting(window.TBOP_SECRETARY.currentMeetingId,payload);
    }else{
      const session=await window.TBOP.api.getSession();
      meeting=await window.TBOP.api.createMeeting({...payload,created_by:session?.user?.id||null});
      window.TBOP_SECRETARY.currentMeetingId=meeting.id;
    }

    await Promise.all([
      window.TBOP.api.replaceMeetingAgenda(meeting.id,[...meetingDraft.agenda]),
      window.TBOP.api.replaceMeetingAttendance(meeting.id,[...meetingDraft.attendance]),
      window.TBOP.api.replaceMeetingMotions(meeting.id,[...meetingDraft.motions])
    ]);

    await window.TBOP.api.auditMeetingChange(meeting.id,"meeting_saved",{
      status:payload.status,
      agenda_items:meetingDraft.agenda.length,
      attendance_count:meetingDraft.attendance.length,
      motions_count:meetingDraft.motions.length
    });

    await loadMeetingArchiveDb();
    alert("Meeting saved.");
  }catch(e){
    alert("Could not save meeting: "+(e.message||e));
  }finally{
    if(btn){btn.disabled=false;btn.textContent="Save Draft";}
  }
}

function resetMeetingDraftDb(){
  window.TBOP_SECRETARY.currentMeetingId=null;
  meetingDraft.attendance=[];
  meetingDraft.agenda=[];
  meetingDraft.motions=[];
  ["meetingTitle","meetingDate","meetingLocation","presidingOfficer","secretaryName",
   "attendanceName","agendaItem","motionText","motionBy","motionSecond",
   "treasurerReport","committeeReports","oldBusiness","newBusiness","announcements",
   "adjournTime"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=""});
  const mt=document.getElementById("meetingTime"); if(mt)mt.value="19:00";
  const ms=document.getElementById("meetingStatus"); if(ms)ms.value="draft";
  const preview=document.getElementById("minutesPreview");
  if(preview)preview.textContent="Fill in the meeting details and click Generate Minutes.";
  renderSecretaryLists();
}

function installSecretaryDbHandlers(){
  if(!document.getElementById("view-meetings"))return;

  if(secretaryDbEnabled()){
    const saveBtn=document.getElementById("saveMeetingBtn");
    if(saveBtn){
      const fresh=saveBtn.cloneNode(true);
      saveBtn.replaceWith(fresh);
      fresh.addEventListener("click",saveMeetingDb);
    }

    const newBtn=document.getElementById("newMeetingBtn");
    if(newBtn){
      const fresh=newBtn.cloneNode(true);
      newBtn.replaceWith(fresh);
      fresh.addEventListener("click",resetMeetingDraftDb);
    }
    document.getElementById("meetingStatusFilter")?.addEventListener("change",renderMeetingArchiveDb);
    loadMeetingArchiveDb();
  }
}

document.addEventListener("DOMContentLoaded",installSecretaryDbHandlers);
