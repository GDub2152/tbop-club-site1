
/* ===== V12 Optional Voting / Elections ===== */
window.TBOP_VOTING={
  enabled:false,
  flag:null,
  elections:[]
};

function votingBackend(){return Boolean(window.TBOP?.api?.configured())}

async function loadVotingFeature(){
  if(!votingBackend()) return;
  try{
    const flag=await window.TBOP.api.getFeatureFlag("voting");
    window.TBOP_VOTING.flag=flag;
    window.TBOP_VOTING.enabled=Boolean(flag?.enabled);
    applyVotingFeatureState();

    if(window.TBOP_VOTING.enabled){
      try{
        window.TBOP_VOTING.elections=await window.TBOP.api.listElections()||[];
      }catch(e){
        console.warn("Could not list elections",e);
        window.TBOP_VOTING.elections=[];
      }
      renderVotingAdminDb();
      renderMemberVotingDb();
    }
  }catch(e){
    console.error("Could not read voting feature flag",e);
  }
}

function applyVotingFeatureState(){
  const enabled=window.TBOP_VOTING.enabled;
  const toggle=document.getElementById("votingEnabledToggle");
  if(toggle)toggle.checked=enabled;
  setText("votingFeatureStatus",enabled?"Enabled":"Disabled");
  const status=document.getElementById("votingFeatureStatus");
  if(status){
    status.classList.toggle("public",enabled);
    status.classList.toggle("officers",!enabled);
  }

  document.getElementById("votingDisabledAdmin")?.classList.toggle("hidden",enabled);
  document.getElementById("votingAdminContent")?.classList.toggle("hidden",!enabled);
  document.getElementById("memberVotingDisabled")?.classList.toggle("hidden",enabled);
  document.getElementById("memberVotingContent")?.classList.toggle("hidden",!enabled);

  // Hide nav entries completely when disabled.
  document.querySelectorAll('[data-view="voting"]').forEach(el=>el.style.display=enabled?"":"none");
  document.querySelectorAll('[data-member-view="member-voting"]').forEach(el=>el.style.display=enabled?"":"none");

  // Dashboard vote metric is hidden rather than showing 0 when module disabled.
  document.getElementById("voteMetric")?.closest(".metric")?.classList.toggle("hidden",!enabled);
  document.getElementById("memberVoteMetric")?.closest(".metric")?.classList.toggle("hidden",!enabled);
}

async function toggleVotingFeature(){
  const toggle=document.getElementById("votingEnabledToggle");
  if(!toggle)return;
  const desired=toggle.checked;
  try{
    toggle.disabled=true;
    await window.TBOP.api.setFeatureFlag(
      "voting",
      desired,
      window.TBOP_VOTING.flag?.configuration||{
        mode:"internal",
        member_label:"Voting",
        show_results_after_close:true
      }
    );
    window.TBOP_VOTING.enabled=desired;
    applyVotingFeatureState();
  }catch(e){
    toggle.checked=!desired;
    alert("Could not change voting setting: "+(e.message||e));
  }finally{
    toggle.disabled=false;
  }
}

function officerElectionPositionsFromForm(){
  return [
    ["President","candPresident"],
    ["Vice President","candVicePresident"],
    ["Secretary","candSecretary"],
    ["Treasurer","candTreasurer"],
    ["Sergeant at Arms","candSergeant"],
    ["Trustee 1","candTrustee1"],
    ["Trustee 2","candTrustee2"],
    ["Trustee 3","candTrustee3"],
    ["Repeater Trustee","candRepeaterTrustee"]
  ].map(([office,id])=>({
    office,
    candidates:(document.getElementById(id)?.value||"")
      .split(",").map(x=>x.trim()).filter(Boolean),
    allow_write_in:(document.getElementById("electionWriteIn")?.value||"yes")==="yes",
    seat_count:1
  }));
}

async function createOfficerElectionDb(){
  if(!window.TBOP_VOTING.enabled){
    alert("Voting is disabled. Enable it under Website Admin first.");
    return;
  }
  const title=document.getElementById("electionTitle")?.value||"Annual Officer Election";
  const close=document.getElementById("electionClose")?.value||"";
  const results=document.getElementById("electionResults")?.value||"closed";
  const session=await window.TBOP.api.getSession();

  try{
    const election=await window.TBOP.api.createElection({
      title,
      election_type:"officer",
      status:"draft",
      closes_at:close?new Date(close+"T23:59:59").toISOString():null,
      allow_write_ins:(document.getElementById("electionWriteIn")?.value||"yes")==="yes",
      results_visibility:results==="live"?"live":"after_close",
      created_by:session?.user?.id||null
    });
    await window.TBOP.api.replaceElectionPositions(election.id,officerElectionPositionsFromForm());
    alert("Officer election created as a Draft.");
    await loadVotingFeature();
  }catch(e){
    alert("Could not create election: "+(e.message||e));
  }
}

function renderVotingAdminDb(){
  const wrap=document.getElementById("voteList");
  if(!wrap || !window.TBOP_VOTING.enabled)return;
  const rows=window.TBOP_VOTING.elections;
  setText("activeBallotMetric",rows.filter(e=>e.status==="open").length);

  wrap.innerHTML=rows.length?rows.map(e=>`
    <article class="event-item">
      <div>
        <span class="pill">${e.election_type||"election"}</span>
        <h3>${e.title}</h3>
        <div class="event-meta">${statusLabelVoting(e.status)}${e.closes_at?` • closes ${new Date(e.closes_at).toLocaleString()}`:""}</div>
        <p>${e.description||""}</p>
      </div>
      <div class="meeting-actions">
        ${e.status==="draft"?`<button class="button small" onclick="setElectionStatus('${e.id}','open')">Open Voting</button>`:""}
        ${e.status==="open"?`<button class="button secondary small" onclick="setElectionStatus('${e.id}','closed')">Close Voting</button>`:""}
        ${e.status==="closed"?`<button class="button secondary small" onclick="showElectionResults('${e.id}')">Results</button>`:""}
        <button class="button danger small" onclick="removeElectionDb('${e.id}')">Remove</button>
      </div>
    </article>`).join(""):`<div class="card"><p>No elections have been created.</p></div>`;
}

function statusLabelVoting(s){
  return (s||"draft").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
}

async function setElectionStatus(id,status){
  try{
    const patch={status,updated_at:new Date().toISOString()};
    const session=await window.TBOP.api.getSession();
    if(status==="open"){
      patch.opens_at=new Date().toISOString();
      patch.opened_by=session?.user?.id||null;
    }
    if(status==="closed"){
      patch.closes_at=new Date().toISOString();
      patch.closed_by=session?.user?.id||null;
    }
    await window.TBOP.api.updateElection(id,patch);
    await loadVotingFeature();
  }catch(e){alert("Could not update election: "+(e.message||e))}
}
window.setElectionStatus=setElectionStatus;

async function removeElectionDb(id){
  if(!confirm("Remove this election?"))return;
  try{
    await window.TBOP.api.deleteElection(id);
    await loadVotingFeature();
  }catch(e){alert("Could not remove election: "+(e.message||e))}
}
window.removeElectionDb=removeElectionDb;

async function showElectionResults(id){
  try{
    const rows=await window.TBOP.api.getElectionResults(id);
    const grouped={};
    (rows||[]).forEach(r=>{
      if(!grouped[r.office_name])grouped[r.office_name]=[];
      grouped[r.office_name].push(r);
    });
    const text=Object.entries(grouped).map(([office,items])=>{
      return office+"\n"+items.map(x=>`  ${x.candidate_name||x.write_in_text||"Abstain"}: ${x.vote_count}`).join("\n");
    }).join("\n\n");
    alert(text||"No votes recorded.");
  }catch(e){alert("Could not display results: "+(e.message||e))}
}
window.showElectionResults=showElectionResults;

function renderMemberVotingDb(){
  const wrap=document.getElementById("memberVotingList");
  if(!wrap || !window.TBOP_VOTING.enabled)return;
  const rows=window.TBOP_VOTING.elections.filter(e=>e.status==="open");
  wrap.innerHTML=rows.length?rows.map(e=>`
    <article class="event-item">
      <div>
        <span class="pill public">Open Ballot</span>
        <h3>${e.title}</h3>
        <div class="event-meta">${e.closes_at?`Closes ${new Date(e.closes_at).toLocaleString()}`:"No closing time listed"}</div>
        <p>Open this ballot to review the candidates and submit your vote.</p>
      </div>
      <button class="button small" onclick="openMemberBallot('${e.id}')">Vote</button>
    </article>`).join(""):`<div class="card"><p>No ballots are currently open.</p></div>`;
}

async function openMemberBallot(electionId){
  try{
    const election=(await window.TBOP.api.listElections()).find(e=>e.id===electionId);
    if(!election)throw new Error("Election not available.");

    const positions=election.election_positions||[];
    const overlay=document.createElement("div");
    overlay.className="ballot-overlay";
    overlay.innerHTML=`<div class="ballot-modal">
      <div class="section-head"><div><span class="eyebrow">Secure Ballot</span><h2>${election.title}</h2></div><button class="text-button" id="closeBallotModal">Close</button></div>
      <form id="memberBallotForm">
        ${positions.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(p=>`
          <fieldset class="ballot-fieldset">
            <legend>${p.office_name}</legend>
            ${(p.candidates||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(c=>`
              <label class="ballot-choice"><input type="radio" name="pos_${p.id}" value="${c.id}" data-position="${p.id}"> ${c.candidate_name}</label>
            `).join("")}
            ${p.allow_write_in?`<label class="ballot-choice write-in-choice"><input type="radio" name="pos_${p.id}" value="writein" data-position="${p.id}"> Write-in <input class="writein-input" data-writein-position="${p.id}" placeholder="Name"></label>`:""}
          </fieldset>`).join("")}
        <button class="button" type="submit">Submit Ballot</button>
      </form>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#closeBallotModal").addEventListener("click",()=>overlay.remove());
    overlay.querySelector("#memberBallotForm").addEventListener("submit",async ev=>{
      ev.preventDefault();
      const choices=[];
      positions.forEach(p=>{
        const selected=overlay.querySelector(`input[name="pos_${p.id}"]:checked`);
        if(!selected)return;
        if(selected.value==="writein"){
          choices.push({
            position_id:p.id,
            candidate_id:null,
            write_in_text:overlay.querySelector(`[data-writein-position="${p.id}"]`)?.value?.trim()||""
          });
        }else{
          choices.push({position_id:p.id,candidate_id:selected.value,write_in_text:null});
        }
      });
      if(!choices.length){
        alert("Please make at least one selection.");
        return;
      }
      if(!confirm("Submit this ballot? You will not be able to vote again in this election."))return;
      try{
        await window.TBOP.api.castBallot(electionId,choices);
        overlay.remove();
        alert("Your ballot was submitted.");
        await loadVotingFeature();
      }catch(err){alert("Could not submit ballot: "+(err.message||err))}
    });
  }catch(e){alert("Could not open ballot: "+(e.message||e))}
}
window.openMemberBallot=openMemberBallot;

document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("votingEnabledToggle")?.addEventListener("change",toggleVotingFeature);

  // Replace V5 demo officer election handler with DB version when configured.
  const btn=document.getElementById("createOfficerElectionBtn");
  if(btn && votingBackend()){
    const fresh=btn.cloneNode(true);
    btn.replaceWith(fresh);
    fresh.addEventListener("click",createOfficerElectionDb);
  }

  if(votingBackend())setTimeout(loadVotingFeature,900);
});
