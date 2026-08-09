
const KEY={events:"tbop_events",members:"tbop_members",votes:"tbop_votes",repeater:"tbop_repeater",meetings:"tbop_meetings"};
const defaults={
events:[{id:1,title:"Monthly Club Meeting",date:"2026-09-10",time:"19:00",location:"To be announced",visibility:"public",description:"Regular monthly club meeting."},{id:2,title:"Repeater Work Session",date:"2026-09-19",time:"10:00",location:"Technical site",visibility:"officers",description:"Maintenance and inspection."}],
members:[{id:1,name:"Demo Member",call:"N8XXX",email:"demo@example.org",status:"Active",voting:"yes",dues:"paid"}],
votes:[],
repeater:[{id:1,title:"Quarterly site inspection",date:"2026-09-19",status:"Scheduled",notes:"Check power, antenna system and logs."}],
meetings:[]
};
function load(type){try{const raw=localStorage.getItem(KEY[type]);if(raw)return JSON.parse(raw)}catch(e){}localStorage.setItem(KEY[type],JSON.stringify(defaults[type]));return JSON.parse(JSON.stringify(defaults[type]))}
function save(type,data){localStorage.setItem(KEY[type],JSON.stringify(data))}
function uid(){return Date.now()+Math.floor(Math.random()*10000)}
function fmtDate(v){if(!v)return"No date";return new Date(v+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}
function renderPublic(){const events=load("events").filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date));const cal=document.getElementById("publicCalendar");if(cal)cal.innerHTML=events.length?events.map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div><span class="pill public">Public</span></article>`).join(""):`<div class="card"><p>No public events are currently scheduled.</p></div>`;const next=document.getElementById("nextEvent");if(next)next.textContent=events[0]?`${fmtDate(events[0].date)} — ${events[0].title}`:"None scheduled";const count=document.getElementById("eventCount");if(count)count.textContent=events.length}
function renderHomeEvents(){const wrap=document.getElementById("homeEvents");if(!wrap)return;const events=load("events").filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);wrap.innerHTML=events.length?events.map(e=>`<article class="event-item"><div><span class="pill public">${fmtDate(e.date)}</span><h3>${e.title}</h3><div class="event-meta">${e.time||""}${e.location?(" • "+e.location):""}</div><p>${e.description||""}</p></div></article>`).join(""):`<div class="card"><p>No public events are currently scheduled.</p></div>`}
function portalNav(){document.querySelectorAll("#portalNav button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#portalNav button").forEach(b=>b.classList.remove("active"));document.querySelectorAll(".portal-view").forEach(v=>v.classList.remove("active"));btn.classList.add("active");document.getElementById("view-"+btn.dataset.view)?.classList.add("active")}))}
function renderEvents(){const wrap=document.getElementById("adminEvents");if(!wrap)return;wrap.innerHTML=load("events").sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div><div><span class="pill ${e.visibility}">${e.visibility}</span> <button class="button danger small" onclick="removeItem('events',${e.id})">Remove</button></div></article>`).join("")}
function renderMembers(){
  const body=document.getElementById("memberTable");
  const members=load("members");
  if(body)body.innerHTML=members.map(m=>`<tr>
    <td>${m.name}</td>
    <td>${m.call||""}</td>
    <td><span class="${m.status==="Active"?"status-good":m.status==="Pending"?"status-warn":"status-muted"}">${m.status}</span></td>
    <td>${(m.voting||"yes")==="yes"?"Eligible":"Not eligible"}</td>
    <td>${(m.dues||"paid")==="paid"?"Paid":(m.dues==="family"?"Family":"Unpaid")}</td>
    <td><button class="button danger small" onclick="removeItem('members',${m.id})">Remove</button></td>
  </tr>`).join("");
  setText("activeMemberCount",members.filter(m=>m.status==="Active").length);
  setText("eligibleMemberCount",members.filter(m=>m.status==="Active"&&(m.voting||"yes")==="yes").length);
  setText("paidMemberCount",members.filter(m=>(m.dues||"paid")==="paid"||m.dues==="family").length);
  setText("votingEligibleMetric",members.filter(m=>m.status==="Active"&&(m.voting||"yes")==="yes").length);
}
function renderVotes(){
  const wrap=document.getElementById("voteList");if(!wrap)return;
  const votes=load("votes");
  setText("activeBallotMetric",votes.length);
  wrap.innerHTML=votes.length?votes.map(v=>{
    if(v.kind==="officer-election"){
      const positions=(v.positions||[]).map(p=>`<div class="ballot-position"><strong>${p.office}</strong><small>${p.candidates.length?p.candidates.join(", "):"No candidates entered"}${v.writeIn==="yes"?" • Write-ins allowed":""}</small></div>`).join("");
      return `<article class="event-item"><div><span class="pill public">Officer Election</span><h3>${v.title}</h3><div class="event-meta">Secret ballot${v.close?(" • closes "+fmtDate(v.close)):""} • ${v.results==="closed"?"Results hidden until close":"Live results enabled"}</div><div class="ballot-positions">${positions}</div></div><button class="button danger small" onclick="removeItem('votes',${v.id})">Archive/Remove</button></article>`;
    }
    return `<article class="event-item"><div><h3>${v.title}</h3><div class="event-meta">${v.type}${v.close?(" • closes "+fmtDate(v.close)):""}</div><p>${v.question}</p><div>${(v.options||[]).map(o=>`<span class="pill">${o}</span>`).join(" ")}</div></div><button class="button danger small" onclick="removeItem('votes',${v.id})">Archive/Remove</button></article>`;
  }).join(""):`<div class="card"><p>No active demo votes.</p></div>`;
}
function renderRepeater(){const wrap=document.getElementById("repeaterTasks");if(wrap)wrap.innerHTML=load("repeater").map(t=>`<article class="event-item"><div><h3>${t.title}</h3><div class="event-meta">${fmtDate(t.date)} • ${t.status}</div><p>${t.notes||""}</p></div><button class="button danger small" onclick="removeItem('repeater',${t.id})">Remove</button></article>`).join("")}
function renderMetrics(){const m=document.getElementById("memberMetric");if(!m)return;m.textContent=load("members").filter(x=>x.status==="Active").length;document.getElementById("eventMetric").textContent=load("events").length;document.getElementById("voteMetric").textContent=load("votes").length;document.getElementById("repeaterMetric").textContent=load("repeater").filter(x=>x.status!=="Completed").length}
function removeItem(type,id){save(type,load(type).filter(x=>x.id!==id));renderAll()}window.removeItem=removeItem;
function forms(){
document.getElementById("eventForm")?.addEventListener("submit",e=>{e.preventDefault();const d=load("events");d.push({id:uid(),title:eventTitle.value,date:eventDate.value,time:eventTime.value,location:eventLocation.value,visibility:eventVisibility.value,repeat:(document.getElementById("eventRepeat")?.value||"none"),description:eventDescription.value});save("events",d);e.target.reset();renderAll()});
document.getElementById("memberForm")?.addEventListener("submit",e=>{e.preventDefault();const d=load("members");d.push({id:uid(),name:memberName.value,call:memberCall.value,email:memberEmail.value,status:memberStatus.value,voting:(document.getElementById("memberVoting")?.value||"yes"),dues:(document.getElementById("memberDues")?.value||"paid")});save("members",d);e.target.reset();renderAll()});
document.getElementById("voteForm")?.addEventListener("submit",e=>{e.preventDefault();const d=load("votes");d.push({id:uid(),title:voteTitle.value,question:voteQuestion.value,options:voteOptions.value.split(",").map(s=>s.trim()).filter(Boolean),close:voteClose.value,type:voteType.value});save("votes",d);e.target.reset();renderAll()});
document.getElementById("repeaterForm")?.addEventListener("submit",e=>{e.preventDefault();const d=load("repeater");d.push({id:uid(),title:taskTitle.value,date:taskDate.value,status:taskStatus.value,notes:taskNotes.value});save("repeater",d);e.target.reset();renderAll()});
}
function renderAll(){renderPublic();renderHomeEvents();renderEvents();renderMembers();renderVotes();renderRepeater();renderMetrics()}
document.addEventListener("DOMContentLoaded",()=>{portalNav();forms();renderAll();const btn=document.querySelector(".menu-toggle"),nav=document.getElementById("mainNav");if(btn&&nav)btn.addEventListener("click",()=>nav.classList.toggle("open"))});


const LIVE = {
  lat: 41.42472,
  lon: -81.82135,
  weatherUrl: "https://api.open-meteo.com/v1/forecast?latitude=41.42472&longitude=-81.82135&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York",
  f107Url: "https://services.swpc.noaa.gov/json/f107_cm_flux.json",
  kpUrl: "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
};

function weatherText(code){
  const map={
    0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Cloudy",
    45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",
    61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",
    80:"Rain showers",81:"Rain showers",82:"Heavy showers",95:"Thunderstorms",96:"Thunderstorms",99:"Severe thunderstorms"
  };
  return map[code] || "Current conditions";
}

function setText(id,text){const el=document.getElementById(id);if(el)el.textContent=text}

async function loadWeather(){
  try{
    const r=await fetch(LIVE.weatherUrl,{cache:"no-store"});
    if(!r.ok)throw new Error("weather response");
    const d=await r.json(), c=d.current||{};
    setText("wxTemp",Number.isFinite(c.temperature_2m)?`${Math.round(c.temperature_2m)}°F`:"—");
    setText("wxDetail",`${weatherText(c.weather_code)}${Number.isFinite(c.apparent_temperature)?` • Feels ${Math.round(c.apparent_temperature)}°F`:""}`);
    setText("wxHumidity",Number.isFinite(c.relative_humidity_2m)?`Humidity ${Math.round(c.relative_humidity_2m)}%`:"Humidity —");
    setText("wxWind",Number.isFinite(c.wind_speed_10m)?`Wind ${Math.round(c.wind_speed_10m)} mph`:"Wind —");
    return true;
  }catch(e){
    setText("wxTemp","Unavailable");
    setText("wxDetail","Weather feed temporarily unavailable");
    return false;
  }
}

function latestNumber(rows, keys){
  if(!Array.isArray(rows)) return null;
  for(let i=rows.length-1;i>=0;i--){
    const row=rows[i];
    for(const k of keys){
      const n=Number(row?.[k]);
      if(Number.isFinite(n))return n;
    }
  }
  return null;
}

function hfRating(sfi,kp){
  if(sfi==null && kp==null)return "Unknown";
  if(kp!=null && kp>=6)return "Poor";
  if(kp!=null && kp>=4)return "Fair";
  if(sfi!=null && sfi>=180 && (kp==null||kp<=2))return "Excellent";
  if(sfi!=null && sfi>=130 && (kp==null||kp<=3))return "Good";
  if(sfi!=null && sfi>=90)return "Fair";
  return "Poor";
}

function conditionClass(v){
  return "cond-"+String(v).toLowerCase().replace(/\s+/g,"-");
}

function estimateBands(sfi,kp){
  const storm = kp!=null ? kp : 2;
  const flux = sfi!=null ? sfi : 100;
  let high = flux>=160?"Excellent":flux>=125?"Good":flux>=90?"Fair":"Poor";
  let mid  = storm>=5?"Poor":storm>=4?"Fair":flux>=110?"Good":"Fair";
  let low  = storm>=6?"Poor":storm>=4?"Fair":"Good";
  if(storm>=5) high="Poor";
  else if(storm>=4 && high==="Excellent") high="Fair";
  return [
    ["80m",low],["40m",mid],["20m",high],["17m",high],["15m",high],
    ["10m",flux>=150&&storm<=3?"Good":flux>=110&&storm<=3?"Fair":"Poor"],
    ["6m","Variable"],["2m","Local"],["70cm","Local"]
  ];
}

function renderBands(sfi,kp){
  const el=document.getElementById("bandGrid"); if(!el)return;
  el.innerHTML=estimateBands(sfi,kp).map(([band,val])=>{
    const klass=(val==="Local")?"cond-local":(val==="Variable"?"cond-fair":conditionClass(val));
    return `<span>${band} <b class="${klass}">${val}</b></span>`;
  }).join("");
}

async function fetchJson(url){
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok)throw new Error("feed response");
  return await r.json();
}

async function loadSolar(){
  let sfi=null,kp=null, ok=0;
  try{
    const d=await fetchJson(LIVE.f107Url);
    sfi=latestNumber(d,["flux","f107","f10_7","value"]);
    if(sfi!=null)ok++;
  }catch(e){}
  try{
    const d=await fetchJson(LIVE.kpUrl);
    kp=latestNumber(d,["kp_index","estimated_kp","kp","Kp"]);
    if(kp!=null)ok++;
  }catch(e){}
  setText("solarSfi",sfi!=null?`SFI ${Math.round(sfi)}`:"SFI —");
  setText("solarKp",kp!=null?`Kp ${kp.toFixed(1)}`:"Kp —");
  const rating=hfRating(sfi,kp);
  setText("solarRating",`HF outlook ${rating}`);
  setText("solarDetail",ok?`NOAA space-weather feed${ok===1?" (partial)":""}`:"NOAA feed temporarily unavailable");
  renderBands(sfi,kp);
  return ok>0;
}

async function refreshLiveData(){
  await Promise.all([loadWeather(),loadSolar()]);
  const stamp=new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
  setText("liveUpdated",`Live data updated ${stamp}`);
}

document.addEventListener("DOMContentLoaded",()=>{
  refreshLiveData();
  setInterval(refreshLiveData,10*60*1000);
});


/* ===== V4 calendar ===== */
let calendarCursor = new Date();
calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);

function expandedPublicEvents(){
  const base=load("events").filter(e=>e.visibility==="public");
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
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function renderMonthCalendar(){
  const grid=document.getElementById("calendarGrid"), title=document.getElementById("calendarTitle");
  if(!grid||!title)return;
  title.textContent=calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const first=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth(),1);
  const start=new Date(first); start.setDate(1-first.getDay());
  const events=expandedPublicEvents();
  const today=new Date();
  let html="";
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const dayEvents=events.filter(e=>sameDay(e._date,d));
    const muted=d.getMonth()!==calendarCursor.getMonth()?" muted-day":"";
    const todayClass=sameDay(d,today)?" today":"";
    html+=`<div class="calendar-day${muted}${todayClass}">
      <div class="day-number">${d.getDate()}</div>
      <div class="day-events">${dayEvents.slice(0,3).map(e=>`<span class="day-event">${e.title}<small>${e.time||""}</small></span>`).join("")}</div>
    </div>`;
  }
  grid.innerHTML=html;
}
function setupCalendarControls(){
  const p=document.getElementById("calPrev"),n=document.getElementById("calNext"),t=document.getElementById("calToday");
  if(p)p.addEventListener("click",()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderMonthCalendar()});
  if(n)n.addEventListener("click",()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderMonthCalendar()});
  if(t)t.addEventListener("click",()=>{const d=new Date();calendarCursor=new Date(d.getFullYear(),d.getMonth(),1);renderMonthCalendar()});
}

/* ===== V4 Secretary ===== */
const meetingDraft={attendance:[],agenda:[],motions:[]};

function renderSecretaryLists(){
  const a=document.getElementById("attendanceList");
  if(a)a.innerHTML=meetingDraft.attendance.map((x,i)=>`<span class="chip">${x}<button onclick="removeSecretaryItem('attendance',${i})">×</button></span>`).join("");
  const g=document.getElementById("agendaList");
  if(g)g.innerHTML=meetingDraft.agenda.map((x,i)=>`<li class="meeting-row"><span>${x}</span><button class="text-button" onclick="removeSecretaryItem('agenda',${i})">Remove</button></li>`).join("");
  const m=document.getElementById("motionList");
  if(m)m.innerHTML=meetingDraft.motions.map((x,i)=>`<div class="meeting-row"><div><strong>${x.text}</strong><br><small>Moved by ${x.by||"—"} • Seconded by ${x.second||"—"} • ${x.result}</small></div><button class="text-button" onclick="removeSecretaryItem('motions',${i})">Remove</button></div>`).join("");
}
function removeSecretaryItem(type,index){meetingDraft[type].splice(index,1);renderSecretaryLists()} window.removeSecretaryItem=removeSecretaryItem;

function setupSecretary(){
  const addAttendance=document.getElementById("addAttendanceBtn");
  addAttendance?.addEventListener("click",()=>{const el=document.getElementById("attendanceName");const v=el.value.trim();if(v){meetingDraft.attendance.push(v);el.value="";renderSecretaryLists()}});
  document.getElementById("addAgendaBtn")?.addEventListener("click",()=>{const el=document.getElementById("agendaItem");const v=el.value.trim();if(v){meetingDraft.agenda.push(v);el.value="";renderSecretaryLists()}});
  document.getElementById("addMotionBtn")?.addEventListener("click",()=>{
    const text=document.getElementById("motionText").value.trim();
    if(!text)return;
    meetingDraft.motions.push({
      text,
      by:document.getElementById("motionBy").value.trim(),
      second:document.getElementById("motionSecond").value.trim(),
      result:document.getElementById("motionResult").value
    });
    ["motionText","motionBy","motionSecond"].forEach(id=>document.getElementById(id).value="");
    renderSecretaryLists();
  });
  document.getElementById("generateMinutesBtn")?.addEventListener("click",generateMinutes);
  document.getElementById("saveMeetingBtn")?.addEventListener("click",saveMeetingDraft);
  document.getElementById("newMeetingBtn")?.addEventListener("click",resetMeetingDraft);
  document.getElementById("copyMinutesBtn")?.addEventListener("click",async()=>{
    const text=document.getElementById("minutesPreview")?.textContent||"";
    try{await navigator.clipboard.writeText(text);setText("copyMinutesBtn","Copied")}catch(e){}
    setTimeout(()=>setText("copyMinutesBtn","Copy"),1200);
  });
  renderSecretaryLists();
  renderMeetingArchive();
}

function val(id){return document.getElementById(id)?.value?.trim()||""}
function bullets(items){return items.length?items.map(x=>`- ${x}`).join("\\n"):"- None recorded"}
function generateMinutes(){
  const title=val("meetingTitle")||"Club Meeting";
  const date=val("meetingDate")||"Date not entered";
  const time=val("meetingTime")||"";
  const location=val("meetingLocation")||"Location not entered";
  const presiding=val("presidingOfficer")||"Not recorded";
  const secretary=val("secretaryName")||"Not recorded";
  const motions=meetingDraft.motions.length?meetingDraft.motions.map((m,i)=>`${i+1}. ${m.text}\\n   Moved by: ${m.by||"—"}\\n   Seconded by: ${m.second||"—"}\\n   Result: ${m.result}`).join("\\n\\n"):"None recorded.";
  const text=`THE BLOWTORCH OF PARMA AMATEUR RADIO CLUB
${title.toUpperCase()} MINUTES

Date: ${date}
Time: ${time||"Not recorded"}
Location: ${location}
Presiding Officer: ${presiding}
Secretary: ${secretary}

CALL TO ORDER
The meeting was called to order by ${presiding}.

ATTENDANCE
${bullets(meetingDraft.attendance)}

AGENDA
${meetingDraft.agenda.length?meetingDraft.agenda.map((x,i)=>`${i+1}. ${x}`).join("\\n"):"No agenda items recorded."}

TREASURER'S REPORT
${val("treasurerReport")||"No report recorded."}

COMMITTEE / TRUSTEE REPORTS
${val("committeeReports")||"No reports recorded."}

OLD BUSINESS
${val("oldBusiness")||"None recorded."}

NEW BUSINESS
${val("newBusiness")||"None recorded."}

MOTIONS
${motions}

ANNOUNCEMENTS
${val("announcements")||"None recorded."}

ADJOURNMENT
The meeting was adjourned${val("adjournTime")?` at ${val("adjournTime")}`:""}.

Respectfully submitted,
${secretary}
Secretary
The Blowtorch of Parma Amateur Radio Club`;
  const p=document.getElementById("minutesPreview"); if(p)p.textContent=text;
  return text;
}
function saveMeetingDraft(){
  const data=load("meetings");
  data.unshift({
    id:uid(),title:val("meetingTitle")||"Club Meeting",date:val("meetingDate"),location:val("meetingLocation"),
    minutes:generateMinutes(),attendance:[...meetingDraft.attendance],agenda:[...meetingDraft.agenda],motions:[...meetingDraft.motions]
  });
  save("meetings",data);
  renderMeetingArchive();
}
function resetMeetingDraft(){
  meetingDraft.attendance=[];meetingDraft.agenda=[];meetingDraft.motions=[];
  ["meetingTitle","meetingDate","meetingLocation","presidingOfficer","secretaryName","attendanceName","agendaItem","motionText","motionBy","motionSecond","treasurerReport","committeeReports","oldBusiness","newBusiness","announcements","adjournTime"].forEach(id=>{
    const el=document.getElementById(id); if(el)el.value="";
  });
  const mt=document.getElementById("meetingTime"); if(mt)mt.value="19:00";
  const p=document.getElementById("minutesPreview"); if(p)p.textContent="Fill in the meeting details and click Generate Minutes.";
  renderSecretaryLists();
}
function renderMeetingArchive(){
  const wrap=document.getElementById("meetingArchive");if(!wrap)return;
  const items=load("meetings");
  wrap.innerHTML=items.length?items.map(m=>`<article class="event-item"><div><h3>${m.title}</h3><div class="event-meta">${m.date?fmtDate(m.date):"No date"}${m.location?(" • "+m.location):""}</div><p>${(m.attendance||[]).length} attendees • ${(m.motions||[]).length} motions</p></div><button class="button danger small" onclick="removeItem('meetings',${m.id})">Remove Draft</button></article>`).join(""):`<div class="card"><p>No saved meeting drafts yet.</p></div>`;
}

/* extend v4 renders */
const renderAllV3=renderAll;
renderAll=function(){renderAllV3();renderMonthCalendar();renderMeetingArchive();};
document.addEventListener("DOMContentLoaded",()=>{setupCalendarControls();setupSecretary();renderMonthCalendar();});


function splitCandidates(id){
  return (document.getElementById(id)?.value||"").split(",").map(x=>x.trim()).filter(Boolean);
}
function setupOfficerElection(){
  document.getElementById("createOfficerElectionBtn")?.addEventListener("click",()=>{
    const positions=[
      ["President","candPresident"],["Vice President","candVicePresident"],["Secretary","candSecretary"],
      ["Treasurer","candTreasurer"],["Sergeant at Arms","candSergeant"],["Trustee 1","candTrustee1"],
      ["Trustee 2","candTrustee2"],["Trustee 3","candTrustee3"],["Repeater Trustee","candRepeaterTrustee"]
    ].map(([office,id])=>({office,candidates:splitCandidates(id)}));
    const votes=load("votes");
    votes.push({
      id:uid(),
      kind:"officer-election",
      title:document.getElementById("electionTitle")?.value||"Annual Officer Election",
      close:document.getElementById("electionClose")?.value||"",
      writeIn:document.getElementById("electionWriteIn")?.value||"yes",
      results:document.getElementById("electionResults")?.value||"closed",
      positions
    });
    save("votes",votes);
    renderAll();
  });
}
document.addEventListener("DOMContentLoaded",setupOfficerElection);


/* ===== V6 demo auth / role preview ===== */
const AUTH_KEY="tbop_demo_session";
const roleLabels={
  member:"Member",president:"President",vice_president:"Vice President",
  secretary:"Secretary",treasurer:"Treasurer",sergeant_at_arms:"Sergeant at Arms",
  trustee:"Trustee",repeater_trustee:"Repeater Trustee",admin:"Administrator"
};
const officerRoles=new Set(["president","vice_president","secretary","treasurer","sergeant_at_arms","trustee","repeater_trustee","admin"]);

function getSession(){
  try{return JSON.parse(sessionStorage.getItem(AUTH_KEY)||"null")}catch(e){return null}
}
function setSession(data){sessionStorage.setItem(AUTH_KEY,JSON.stringify(data))}
function clearSession(){sessionStorage.removeItem(AUTH_KEY)}

function setupDemoLogin(){
  const form=document.getElementById("demoLoginForm");
  if(!form)return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const role=document.getElementById("loginRole").value;
    const email=document.getElementById("loginEmail").value||"demo@theblowtorchofparma.com";
    setSession({role,email,name:"Demo Member",demo:true});
    location.href=officerRoles.has(role)?"portal.html":"member.html";
  });
}
function setupLogout(){
  document.querySelectorAll("#logoutBtn").forEach(btn=>btn.addEventListener("click",()=>{
    clearSession();location.href="login.html";
  }));
}
function setupMemberNav(){
  document.querySelectorAll("#memberNav button").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll("#memberNav button").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".member-view").forEach(v=>v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.memberView)?.classList.add("active");
  }));
}
function memberVoteMarkup(v){
  if(v.kind==="officer-election"){
    return `<article class="event-item"><div><span class="pill public">Officer Election</span><h3>${v.title}</h3><div class="event-meta">${v.close?("Closes "+fmtDate(v.close)):"No closing date"}</div><p>Ballot preview is available. Actual voting will be enabled only after secure authentication and database storage are connected.</p></div><button class="button secondary small" disabled>Secure voting required</button></article>`;
  }
  return `<article class="event-item"><div><h3>${v.title}</h3><p>${v.question||""}</p></div><button class="button secondary small" disabled>Secure voting required</button></article>`;
}
function renderMemberPortal(){
  const session=getSession();
  if(!document.getElementById("memberRoleBadge"))return;
  const role=session?.role||"member";
  const label=roleLabels[role]||"Member";
  setText("memberRoleBadge",label);
  setText("profileDisplayRole",label);
  if(session?.name)setText("profileDisplayName",session.name);
  const officerLink=document.getElementById("officerPortalLink");
  if(officerLink&&officerRoles.has(role))officerLink.classList.remove("hidden");

  const events=load("events").filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date));
  const votes=load("votes");
  setText("memberEventMetric",events.length);
  setText("memberVoteMetric",votes.length);

  const upcoming=document.getElementById("memberUpcomingEvents");
  if(upcoming)upcoming.innerHTML=events.slice(0,3).map(e=>`<div class="mini-list-item"><strong>${e.title}</strong><small>${fmtDate(e.date)}</small></div>`).join("")||"<p class='muted'>No events scheduled.</p>";

  const active=document.getElementById("memberActiveVotes");
  if(active)active.innerHTML=votes.slice(0,3).map(v=>`<div class="mini-list-item"><strong>${v.title}</strong><small>${v.close?("Closes "+fmtDate(v.close)):"Open"}</small></div>`).join("")||"<p class='muted'>No active ballots.</p>";

  const cal=document.getElementById("memberCalendarList");
  if(cal)cal.innerHTML=events.map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""}${e.location?(" • "+e.location):""}</div><p>${e.description||""}</p></div></article>`).join("")||"<div class='card'><p>No public events scheduled.</p></div>";

  const voting=document.getElementById("memberVotingList");
  if(voting)voting.innerHTML=votes.map(memberVoteMarkup).join("")||"<div class='card'><p>No active ballots.</p></div>";
}
function applyOfficerRole(){
  if(!document.getElementById("officerRoleBadge"))return;
  const session=getSession();
  const role=session?.role||"admin";
  setText("officerRoleBadge",`Demo ${roleLabels[role]||"Administrator"}`);

  const allowed={
    president:["dashboard","calendar","meetings","members","documents","treasurer","voting","repeater","equipment","news","analytics","approvals","backup","website"],
    vice_president:["dashboard","calendar","meetings","members","documents","treasurer","voting","repeater","equipment","news","analytics","approvals","backup","website"],
    secretary:["dashboard","calendar","meetings","members","documents","treasurer","voting","repeater","equipment","news","analytics","approvals","backup","website"],
    treasurer:["dashboard","calendar","meetings","members","documents","treasurer","voting","repeater","equipment","news","analytics","approvals","backup","website"],
    sergeant_at_arms:["dashboard","calendar","meetings","members","documents","treasurer","voting","repeater","equipment","news","analytics","approvals","backup","website"],
    trustee:["dashboard","calendar","meetings","documents","voting"],
    repeater_trustee:["dashboard","calendar","documents","repeater","equipment","analytics"],
    admin:["dashboard","calendar","meetings","members","documents","treasurer","voting","repeater","equipment","news","analytics","approvals","backup","website"]
  };
  const list=allowed[role]||allowed.admin;
  document.querySelectorAll("#portalNav button").forEach(btn=>{
    btn.style.display=list.includes(btn.dataset.view)?"":"none";
  });
}
document.addEventListener("DOMContentLoaded",()=>{
  setupDemoLogin();
  setupLogout();
  setupMemberNav();
  renderMemberPortal();
  applyOfficerRole();
});


/* ===== V7 Supabase bridge ===== */
async function tbopLoginSubmit(e){
  e.preventDefault();
  const email=document.getElementById("loginEmail")?.value?.trim()||"";
  const password=document.getElementById("loginPassword")?.value||"";
  const role=document.getElementById("loginRole")?.value||"member";
  const btn=document.getElementById("loginSubmitBtn");

  if(window.TBOP?.api?.configured()){
    try{
      if(btn){btn.disabled=true;btn.textContent="Signing in…";}
      const data=await window.TBOP.api.signIn(email,password);
      await window.TBOP.api.createProfileIfMissing(data.user,email.split("@")[0]||"Member");
      const profile=await window.TBOP.api.getMyProfile();
      location.href=window.TBOP.auth.isOfficer(profile?.role)?"portal.html":"member.html";
      return;
    }catch(err){
      alert("Sign in failed: "+(err.message||err));
      if(btn){btn.disabled=false;btn.textContent="Enter Portal";}
      return;
    }
  }

  sessionStorage.setItem("tbop_demo_session",JSON.stringify({role,email,name:"Demo Member",demo:true}));
  location.href=window.TBOP?.auth?.isOfficer(role)?"portal.html":"member.html";
}

async function tbopLogout(){
  try{
    if(window.TBOP?.api?.configured()) await window.TBOP.api.signOut();
  }catch(e){console.error(e)}
  sessionStorage.removeItem("tbop_demo_session");
  const target=document.body?.dataset?.loginPage || "login.html";
  location.href=target;
}

async function tbopUpdateAuthUi(){
  const notice=document.getElementById("authModeNotice");
  const roleSelect=document.getElementById("loginRole");
  if(window.TBOP?.api?.configured()){
    if(notice){
      notice.textContent="SECURE LOGIN ENABLED — authentication is connected to Supabase.";
      notice.classList.add("secure-auth-notice");
    }
    if(roleSelect){
      roleSelect.closest("label").style.display="none";
    }
  }
}

async function tbopProtectPortal(){
  const isOfficerPage=Boolean(document.getElementById("officerRoleBadge"));
  const isMemberPage=Boolean(document.getElementById("memberRoleBadge"));
  if(!isOfficerPage&&!isMemberPage)return;

  const user=await window.TBOP?.auth?.requirePortal(isOfficerPage?"officer":"member");
  if(!user)return;

  if(isOfficerPage){
    setText("officerRoleBadge",`${user.mode==="demo"?"Demo ":""}${roleLabels[user.role]||"Officer"}`);
  }
  if(isMemberPage){
    setText("memberRoleBadge",roleLabels[user.role]||"Member");
    setText("profileDisplayName",user.name||"Member");
    setText("profileDisplayRole",roleLabels[user.role]||"Member");
    const officerLink=document.getElementById("officerPortalLink");
    if(officerLink&&window.TBOP.auth.isOfficer(user.role)) officerLink.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  const loginForm=document.getElementById("demoLoginForm");
  if(loginForm){
    loginForm.replaceWith(loginForm.cloneNode(true));
    document.getElementById("demoLoginForm")?.addEventListener("submit",tbopLoginSubmit);
  }

  document.querySelectorAll("#logoutBtn").forEach(btn=>{
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll("#logoutBtn").forEach(btn=>btn.addEventListener("click",tbopLogout));

  tbopUpdateAuthUi();
  tbopProtectPortal();
});
