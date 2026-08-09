
const KEY={events:"tbop_events",members:"tbop_members",votes:"tbop_votes",repeater:"tbop_repeater"};
const defaults={
events:[{id:1,title:"Monthly Club Meeting",date:"2026-09-10",time:"19:00",location:"To be announced",visibility:"public",description:"Regular monthly club meeting."},{id:2,title:"Repeater Work Session",date:"2026-09-19",time:"10:00",location:"Technical site",visibility:"officers",description:"Maintenance and inspection."}],
members:[{id:1,name:"Demo Member",call:"N8XXX",email:"demo@example.org",status:"Active"}],
votes:[],
repeater:[{id:1,title:"Quarterly site inspection",date:"2026-09-19",status:"Scheduled",notes:"Check power, antenna system and logs."}]
};
function load(type){try{const raw=localStorage.getItem(KEY[type]);if(raw)return JSON.parse(raw)}catch(e){}localStorage.setItem(KEY[type],JSON.stringify(defaults[type]));return JSON.parse(JSON.stringify(defaults[type]))}
function save(type,data){localStorage.setItem(KEY[type],JSON.stringify(data))}
function uid(){return Date.now()+Math.floor(Math.random()*10000)}
function fmtDate(v){if(!v)return"No date";return new Date(v+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}
function renderPublic(){const events=load("events").filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date));const cal=document.getElementById("publicCalendar");if(cal)cal.innerHTML=events.length?events.map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div><span class="pill public">Public</span></article>`).join(""):`<div class="card"><p>No public events are currently scheduled.</p></div>`;const next=document.getElementById("nextEvent");if(next)next.textContent=events[0]?`${fmtDate(events[0].date)} — ${events[0].title}`:"None scheduled";const count=document.getElementById("eventCount");if(count)count.textContent=events.length}
function renderHomeEvents(){const wrap=document.getElementById("homeEvents");if(!wrap)return;const events=load("events").filter(e=>e.visibility==="public").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);wrap.innerHTML=events.length?events.map(e=>`<article class="event-item"><div><span class="pill public">${fmtDate(e.date)}</span><h3>${e.title}</h3><div class="event-meta">${e.time||""}${e.location?(" • "+e.location):""}</div><p>${e.description||""}</p></div></article>`).join(""):`<div class="card"><p>No public events are currently scheduled.</p></div>`}
function portalNav(){document.querySelectorAll("#portalNav button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#portalNav button").forEach(b=>b.classList.remove("active"));document.querySelectorAll(".portal-view").forEach(v=>v.classList.remove("active"));btn.classList.add("active");document.getElementById("view-"+btn.dataset.view)?.classList.add("active")}))}
function renderEvents(){const wrap=document.getElementById("adminEvents");if(!wrap)return;wrap.innerHTML=load("events").sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`<article class="event-item"><div><h3>${e.title}</h3><div class="event-meta">${fmtDate(e.date)} ${e.time?("• "+e.time):""} ${e.location?("• "+e.location):""}</div><p>${e.description||""}</p></div><div><span class="pill ${e.visibility}">${e.visibility}</span> <button class="button danger small" onclick="removeItem('events',${e.id})">Remove</button></div></article>`).join("")}
function renderMembers(){const body=document.getElementById("memberTable");if(body)body.innerHTML=load("members").map(m=>`<tr><td>${m.name}</td><td>${m.call||""}</td><td>${m.status}</td><td><button class="button danger small" onclick="removeItem('members',${m.id})">Remove</button></td></tr>`).join("")}
function renderVotes(){const wrap=document.getElementById("voteList");if(!wrap)return;const votes=load("votes");wrap.innerHTML=votes.length?votes.map(v=>`<article class="event-item"><div><h3>${v.title}</h3><div class="event-meta">${v.type}${v.close?(" • closes "+fmtDate(v.close)):""}</div><p>${v.question}</p><div>${v.options.map(o=>`<span class="pill">${o}</span>`).join(" ")}</div></div><button class="button danger small" onclick="removeItem('votes',${v.id})">Archive/Remove</button></article>`).join(""):`<div class="card"><p>No active demo votes.</p></div>`}
function renderRepeater(){const wrap=document.getElementById("repeaterTasks");if(wrap)wrap.innerHTML=load("repeater").map(t=>`<article class="event-item"><div><h3>${t.title}</h3><div class="event-meta">${fmtDate(t.date)} • ${t.status}</div><p>${t.notes||""}</p></div><button class="button danger small" onclick="removeItem('repeater',${t.id})">Remove</button></article>`).join("")}
function renderMetrics(){const m=document.getElementById("memberMetric");if(!m)return;m.textContent=load("members").filter(x=>x.status==="Active").length;document.getElementById("eventMetric").textContent=load("events").length;document.getElementById("voteMetric").textContent=load("votes").length;document.getElementById("repeaterMetric").textContent=load("repeater").filter(x=>x.status!=="Completed").length}
function removeItem(type,id){save(type,load(type).filter(x=>x.id!==id));renderAll()}window.removeItem=removeItem;
function forms(){
document.getElementById("eventForm")?.addEventListener("submit",e=>{e.preventDefault();const d=load("events");d.push({id:uid(),title:eventTitle.value,date:eventDate.value,time:eventTime.value,location:eventLocation.value,visibility:eventVisibility.value,description:eventDescription.value});save("events",d);e.target.reset();renderAll()});
document.getElementById("memberForm")?.addEventListener("submit",e=>{e.preventDefault();const d=load("members");d.push({id:uid(),name:memberName.value,call:memberCall.value,email:memberEmail.value,status:memberStatus.value});save("members",d);e.target.reset();renderAll()});
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
