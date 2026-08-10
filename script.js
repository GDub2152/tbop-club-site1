const qs=s=>document.querySelector(s); const qsa=s=>[...document.querySelectorAll(s)];
const EVENTS=[
  // Add public events here: {date:'2026-09-10', title:'Club Meeting'}
];
const NEWS=[
  {date:'',title:'Club website',body:'Welcome to the simplified public website for The Blowtorch of Parma Amateur Radio Club.'}
];
function setActive(){const f=location.pathname.split('/').pop()||'index.html';qsa('.menu a').forEach(a=>{if((a.getAttribute('href')||'')===f)a.classList.add('active')})}
async function loadSolar(){
  const sfi=qs('#sfi'),kp=qs('#kp'),status=qs('#solar-status'); if(!sfi)return;
  try{
    const [f,k]=await Promise.all([
      fetch('https://services.swpc.noaa.gov/json/f107_cm_flux.json').then(r=>r.json()),
      fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json').then(r=>r.json())
    ]);
    const flux=Array.isArray(f)&&f.length?f[f.length-1].flux:null;
    const row=Array.isArray(k)&&k.length>1?k[k.length-1]:null; const kval=row?row[1]:null;
    sfi.textContent=flux??'—'; kp.textContent=kval??'—';
    const sf=Number(flux), kv=Number(kval);
    const sfiRating=qs('#sfi-rating'), kpRating=qs('#kp-rating'), sfiBar=qs('#sfi-bar'), kpBar=qs('#kp-bar');
    if(sfiRating) sfiRating.textContent=!Number.isFinite(sf)?'Solar flux unavailable':sf>=150?'Strong solar support':sf>=100?'Good solar support':'Lower solar support';
    if(kpRating) kpRating.textContent=!Number.isFinite(kv)?'Kp unavailable':kv<=2?'Quiet geomagnetic field':kv<=4?'Unsettled geomagnetic field':'Geomagnetic storm conditions';
    if(sfiBar && Number.isFinite(sf)) sfiBar.style.width=Math.max(5,Math.min(100,(sf-60)/1.4))+'%';
    if(kpBar && Number.isFinite(kv)) kpBar.style.width=Math.max(5,Math.min(100,kv/9*100))+'%';
    let grade='fair', label='Fair', title='Mixed propagation conditions', copy='Check the individual SFI and Kp readings before choosing a band.';
    if(Number.isFinite(sf)&&Number.isFinite(kv)){
      if(sf>=100 && kv<=2){grade='good';label='Good';title='Favorable propagation outlook';copy='Solar support is useful and the geomagnetic field is quiet. Higher HF bands may be worth checking.';}
      else if(kv>=5){grade='poor';label='Disturbed';title='Geomagnetic activity is elevated';copy='HF paths may be disturbed or less predictable while Kp remains elevated.';}
      else if(sf<90 && kv>=3){grade='poor';label='Poor';title='Challenging propagation outlook';copy='Lower solar flux combined with geomagnetic activity may reduce HF reliability.';}
      else if(sf>=150 && kv<=4){grade='good';label='Strong';title='Strong solar support available';copy='Solar flux is strong. Conditions can be productive when the path and time of day line up.';}
    }
    qsa('#solar-badge').forEach(b=>{b.className='condition-badge'+(b.classList.contains('large')?' large':'')+' '+grade;b.textContent=label+' conditions'});
    const pt=qs('#propagation-title'), pc=qs('#propagation-copy'); if(pt)pt.textContent=title;if(pc)pc.textContent=copy;
    if(status)status.textContent='Live NOAA SWPC data · updated automatically';
  }catch(e){if(status)status.textContent='Solar data temporarily unavailable';}
}
function renderNews(){const box=qs('#news-list');if(!box)return;box.innerHTML=NEWS.map(n=>`<article class="news-row"><div><strong>${n.title}</strong><div>${n.body}</div></div><small>${n.date}</small></article>`).join('')}
function renderCalendar(){
 const grid=qs('#calendar-grid'),label=qs('#cal-label'); if(!grid)return; let d=new Date(); d.setDate(1);
 function draw(){grid.innerHTML='';['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(x=>grid.insertAdjacentHTML('beforeend',`<div class="cal-cell cal-head">${x}</div>`));label.textContent=d.toLocaleString(undefined,{month:'long',year:'numeric'});const y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();for(let i=0;i<first;i++)grid.insertAdjacentHTML('beforeend','<div class="cal-cell"></div>');for(let day=1;day<=days;day++){const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const ev=EVENTS.filter(e=>e.date===iso).map(e=>`<div class="event">${e.title}</div>`).join('');grid.insertAdjacentHTML('beforeend',`<div class="cal-cell"><div class="cal-date">${day}</div>${ev}</div>`)} }
 qs('#prev')?.addEventListener('click',()=>{d.setMonth(d.getMonth()-1);draw()});qs('#next')?.addEventListener('click',()=>{d.setMonth(d.getMonth()+1);draw()});qs('#today')?.addEventListener('click',()=>{d=new Date();d.setDate(1);draw()});draw();
}
function initVhfMaps(){
  const tabs=qsa('[data-vhf-tab]'),panels=qsa('[data-vhf-panel]');
  if(!tabs.length)return;
  tabs.forEach(tab=>tab.addEventListener('click',()=>{
    const band=tab.dataset.vhfTab;
    tabs.forEach(t=>t.classList.toggle('active',t===tab));
    panels.forEach(p=>p.classList.toggle('active',p.dataset.vhfPanel===band));
  }));
}
document.addEventListener('DOMContentLoaded',()=>{setActive();loadSolar();renderNews();renderCalendar();initVhfMaps()});
