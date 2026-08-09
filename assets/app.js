
const KEY = {
  events: "tbop_events",
  members: "tbop_members",
  votes: "tbop_votes",
  repeater: "tbop_repeater"
};

const defaults = {
  events: [
    {id:1,title:"Monthly Club Meeting",date:"2026-09-10",time:"19:00",location:"To be announced",visibility:"public",description:"Regular monthly club meeting."},
    {id:2,title:"Repeater Work Session",date:"2026-09-19",time:"10:00",location:"Technical site",visibility:"officers",description:"Maintenance and inspection."}
  ],
  members: [
    {id:1,name:"Demo Member",call:"N8XXX",email:"demo@example.org",status:"Active"}
  ],
  votes: [],
  repeater: [
    {id:1,title:"Quarterly site inspection",date:"2026-09-19",status:"Scheduled",notes:"Check power, antenna system and logs."}
  ]
};

function load(type){
  try{
    const raw = localStorage.getItem(KEY[type]);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  localStorage.setItem(KEY[type], JSON.stringify(defaults[type]));
  return structuredClone(defaults[type]);
}
function save(type,data){ localStorage.setItem(KEY[type],JSON.stringify(data)); }
function uid(){ return Date.now()+Math.floor(Math.random()*10000); }
function fmtDate(v){ if(!v) return "No date"; const d=new Date(v+"T12:00:00"); return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); }

function renderPublic(){
  const publicCalendar=document.getElementById("publicCalendar");
  const events=load("events").filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date));
  if(publicCalendar){
    publicCalendar.innerHTML=events.length?events.map(e=>`
      <article class="event-item">
        <div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div>
        <span class="pill public">Public</span>
      </article>`).join(""):`<div class="card"><p>No public events are currently scheduled.</p></div>`;
  }
  const next=document.getElementById("nextEvent");
  const count=document.getElementById("eventCount");
  if(next) next.textContent=events[0]?`${fmtDate(events[0].date)} — ${events[0].title}`:"None scheduled";
  if(count) count.textContent=events.length;
}

function portalNav(){
  document.querySelectorAll("#portalNav button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll("#portalNav button").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".portal-view").forEach(v=>v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("view-"+btn.dataset.view).classList.add("active");
    });
  });
}

function renderEvents(){
  const wrap=document.getElementById("adminEvents"); if(!wrap) return;
  const events=load("events").sort((a,b)=>a.date.localeCompare(b.date));
  wrap.innerHTML=events.map(e=>`
    <article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div>
    <div><span class="pill ${e.visibility}">${e.visibility}</span> <button class="button danger small" onclick="removeItem('events',${e.id})">Remove</button></div></article>`).join("");
}

function renderMembers(){
  const tbody=document.getElementById("memberTable"); if(!tbody)return;
  tbody.innerHTML=load("members").map(m=>`<tr><td>${m.name}</td><td>${m.call||""}</td><td>${m.status}</td><td><button class="button danger small" onclick="removeItem('members',${m.id})">Remove</button></td></tr>`).join("");
}
function renderVotes(){
  const wrap=document.getElementById("voteList"); if(!wrap)return;
  const votes=load("votes");
  wrap.innerHTML=votes.length?votes.map(v=>`<article class="event-item"><div><h3>${v.title}</h3><div class="event-meta">${v.type}${v.close?(" • closes "+fmtDate(v.close)):""}</div><p>${v.question}</p><div>${v.options.map(o=>`<span class="pill">${o}</span>`).join(" ")}</div></div><button class="button danger small" onclick="removeItem('votes',${v.id})">Archive/Remove</button></article>`).join(""):`<div class="card"><p>No active demo votes.</p></div>`;
}
function renderRepeater(){
  const wrap=document.getElementById("repeaterTasks"); if(!wrap)return;
  wrap.innerHTML=load("repeater").map(t=>`<article class="event-item"><div><h3>${t.title}</h3><div class="event-meta">${fmtDate(t.date)} • ${t.status}</div><p>${t.notes||""}</p></div><button class="button danger small" onclick="removeItem('repeater',${t.id})">Remove</button></article>`).join("");
}
function renderMetrics(){
  const m=document.getElementById("memberMetric"); if(!m)return;
  m.textContent=load("members").filter(x=>x.status==="Active").length;
  document.getElementById("eventMetric").textContent=load("events").length;
  document.getElementById("voteMetric").textContent=load("votes").length;
  document.getElementById("repeaterMetric").textContent=load("repeater").filter(x=>x.status!=="Completed").length;
}
function removeItem(type,id){
  save(type,load(type).filter(x=>x.id!==id));
  renderAll();
}
window.removeItem=removeItem;

function forms(){
  const ef=document.getElementById("eventForm");
  ef?.addEventListener("submit",e=>{
    e.preventDefault(); const data=load("events");
    data.push({id:uid(),title:eventTitle.value,date:eventDate.value,time:eventTime.value,location:eventLocation.value,visibility:eventVisibility.value,description:eventDescription.value});
    save("events",data); ef.reset(); renderAll();
  });
  const mf=document.getElementById("memberForm");
  mf?.addEventListener("submit",e=>{
    e.preventDefault(); const data=load("members");
    data.push({id:uid(),name:memberName.value,call:memberCall.value,email:memberEmail.value,status:memberStatus.value});
    save("members",data); mf.reset(); renderAll();
  });
  const vf=document.getElementById("voteForm");
  vf?.addEventListener("submit",e=>{
    e.preventDefault(); const data=load("votes");
    data.push({id:uid(),title:voteTitle.value,question:voteQuestion.value,options:voteOptions.value.split(",").map(s=>s.trim()).filter(Boolean),close:voteClose.value,type:voteType.value});
    save("votes",data); vf.reset(); renderAll();
  });
  const rf=document.getElementById("repeaterForm");
  rf?.addEventListener("submit",e=>{
    e.preventDefault(); const data=load("repeater");
    data.push({id:uid(),title:taskTitle.value,date:taskDate.value,status:taskStatus.value,notes:taskNotes.value});
    save("repeater",data); rf.reset(); renderAll();
  });
}
function renderAll(){ renderPublic();renderEvents();renderMembers();renderVotes();renderRepeater();renderMetrics(); }
document.addEventListener("DOMContentLoaded",()=>{ portalNav();forms();renderAll(); });
