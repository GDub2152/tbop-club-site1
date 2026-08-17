const qs=s=>document.querySelector(s); const qsa=s=>[...document.querySelectorAll(s)];

// Everything on this site is local. Add club events here.
const EVENTS=[
  // Example: {date:'2026-09-10', title:'Club Meeting'}
];

// Add public news items here. Newest items should go first.
const NEWS=[
  {date:'',title:'Club website',body:'Welcome to the public website for The Blowtorch of Parma Amateur Radio Club.'}
];

function setActive(){
  const f=location.pathname.split('/').pop()||'index.html';
  qsa('.menu a').forEach(a=>{if((a.getAttribute('href')||'')===f)a.classList.add('active')});
}
function renderNews(){
  const box=qs('#news-list'); if(!box)return;
  box.innerHTML=NEWS.map(n=>`<article class="news-row"><div><strong>${n.title}</strong><div>${n.body}</div></div><small>${n.date}</small></article>`).join('');
}
function renderCalendar(){
 const grid=qs('#calendar-grid'),label=qs('#cal-label'); if(!grid)return; let d=new Date(); d.setDate(1);
 function draw(){
   grid.innerHTML='';
   ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(x=>grid.insertAdjacentHTML('beforeend',`<div class="cal-cell cal-head">${x}</div>`));
   label.textContent=d.toLocaleString(undefined,{month:'long',year:'numeric'});
   const y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
   for(let i=0;i<first;i++)grid.insertAdjacentHTML('beforeend','<div class="cal-cell"></div>');
   for(let day=1;day<=days;day++){
     const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
     const ev=EVENTS.filter(e=>e.date===iso).map(e=>`<div class="event">${e.title}</div>`).join('');
     grid.insertAdjacentHTML('beforeend',`<div class="cal-cell"><div class="cal-date">${day}</div>${ev}</div>`);
   }
 }
 qs('#prev')?.addEventListener('click',()=>{d.setMonth(d.getMonth()-1);draw()});
 qs('#next')?.addEventListener('click',()=>{d.setMonth(d.getMonth()+1);draw()});
 qs('#today')?.addEventListener('click',()=>{d=new Date();d.setDate(1);draw()});
 draw();
}
document.addEventListener('DOMContentLoaded',()=>{setActive();renderNews();renderCalendar()});
