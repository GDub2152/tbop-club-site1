
(function(){
  function text(id,fallback="—"){
    const el=document.getElementById(id);
    return (el?.textContent||"").trim()||fallback;
  }

  function esc(value){
    const d=document.createElement("div");
    d.textContent=value??"";
    return d.innerHTML;
  }

  function bandRows(){
    const source=document.getElementById("bandGrid");
    if(!source)return "";
    return [...source.querySelectorAll("span")].map(row=>{
      const clone=row.cloneNode(true);
      const b=clone.querySelector("b");
      const status=b?(b.textContent||"").trim():"—";
      if(b)b.remove();
      const band=(clone.textContent||"").trim();
      return `<div class="condition-detail-row"><span>${esc(band)}</span><strong>${esc(status)}</strong></div>`;
    }).join("");
  }

  function modalContent(type){
    if(type==="weather"){
      return {
        eyebrow:"Local Conditions",
        title:"Weather • 44135",
        body:`<div class="condition-hero-value">${esc(text("wxTemp","Loading…"))}</div>
          <p class="condition-detail-lead">${esc(text("wxDetail","Cleveland, Ohio"))}</p>
          <div class="condition-detail-grid">
            <div><span>Humidity</span><strong>${esc(text("wxHumidity").replace(/^Humidity\s*/i,""))}</strong></div>
            <div><span>Wind</span><strong>${esc(text("wxWind").replace(/^Wind\s*/i,""))}</strong></div>
          </div>
          <p class="condition-modal-note">This larger view uses the same live weather information shown on the homepage.</p>`
      };
    }

    if(type==="solar"){
      return {
        eyebrow:"Space Weather",
        title:"Solar Conditions",
        body:`<div class="condition-detail-grid condition-solar-grid">
            <div><span>Solar Flux Index</span><strong>${esc(text("solarSfi").replace(/^SFI\s*/i,""))}</strong></div>
            <div><span>Planetary Kp</span><strong>${esc(text("solarKp").replace(/^Kp\s*/i,""))}</strong></div>
          </div>
          <p class="condition-detail-lead">${esc(text("solarDetail","Loading NOAA space-weather data…"))}</p>
          <div class="condition-outlook-box"><span>HF Outlook</span><strong>${esc(text("solarRating").replace(/^HF outlook\s*/i,""))}</strong></div>
          <p class="condition-modal-note">Solar conditions can change quickly. This panel displays the current values already loaded by the TBOP homepage.</p>`
      };
    }

    return {
      eyebrow:"Propagation",
      title:"Amateur Radio Band Conditions",
      body:`<div class="condition-band-table">${bandRows()}</div>
        <div class="condition-band-legend">
          <p><strong>HF:</strong> 80m through 10m conditions reflect the site's current propagation estimate.</p>
          <p><strong>6m:</strong> Highly dependent on propagation openings and local conditions.</p>
          <p><strong>2m / 70cm:</strong> Primarily local and regional coverage unless enhanced propagation is present.</p>
        </div>`
    };
  }

  function openConditionModal(type){
    const info=modalContent(type);
    const overlay=document.createElement("div");
    overlay.className="condition-modal-overlay";
    overlay.innerHTML=`<div class="condition-modal" role="dialog" aria-modal="true" aria-label="${esc(info.title)}">
      <div class="condition-modal-head">
        <div><span class="eyebrow">${esc(info.eyebrow)}</span><h2>${esc(info.title)}</h2></div>
        <button class="text-button condition-close" type="button" aria-label="Close detailed conditions">Close</button>
      </div>
      <div class="condition-modal-body">${info.body}</div>
    </div>`;

    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    const closeBtn=overlay.querySelector(".condition-close");
    closeBtn?.focus();

    function close(){
      overlay.remove();
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown",keyHandler);
    }
    function keyHandler(e){if(e.key==="Escape")close();}

    closeBtn?.addEventListener("click",close);
    overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
    document.addEventListener("keydown",keyHandler);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll("[data-condition-modal]").forEach(card=>{
      const open=()=>openConditionModal(card.dataset.conditionModal);
      card.addEventListener("click",open);
      card.addEventListener("keydown",e=>{
        if(e.key==="Enter"||e.key===" "){
          e.preventDefault();
          open();
        }
      });
    });
  });
})();
