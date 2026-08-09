
async function renderApprovalCenter(){
  if(!window.TBOP?.api?.configured?.())return;
  try{
    const [profiles,approvals]=await Promise.all([TBOP.api.listProfiles(),TBOP.api.listApprovals()]);
    const pending=(profiles||[]).filter(p=>(p.membership_status||"").toLowerCase()==="pending");
    const other=(approvals||[]).filter(a=>a.status==="pending");
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
    set("pendingMemberMetric",pending.length);set("otherApprovalMetric",other.length);
    const list=document.getElementById("pendingMemberList");
    if(list)list.innerHTML=pending.length?pending.map(p=>`<article class="event-item">
      <div><span class="pill">Pending Member</span><h3>${p.display_name||p.email}</h3>
      <div class="event-meta">${p.callsign?`Callsign ${p.callsign} • `:""}${p.email||""}${p.mobile_phone?` • ${p.mobile_phone}`:""}</div>
      <p>${[p.city,p.state].filter(Boolean).join(", ")||"Location not provided"}</p></div>
      <div class="approval-actions">
        <button class="button small" onclick="approveMember('${p.id}')">Approve</button>
        <button class="button secondary small" onclick="rejectMember('${p.id}')">Reject</button>
      </div>
    </article>`).join(""):`<p>No pending member applications.</p>`;

    const otherList=document.getElementById("approvalCenterOther");
    if(otherList)otherList.innerHTML=other.length?other.map(a=>`<article class="event-item"><div><span class="pill">${a.request_type}</span><h3>${a.title}</h3><p>${a.details||""}</p></div></article>`).join(""):`<p>No other pending approval requests.</p>`;
  }catch(e){console.error("Approval center:",e)}
}
async function approveMember(id){
  if(!confirm("Approve this member and set membership status to Active?"))return;
  try{await TBOP.api.setMemberStatus(id,"active");await renderApprovalCenter();if(window.refreshDbModules)await refreshDbModules()}
  catch(e){alert("Could not approve member: "+(e.message||e))}
}
async function rejectMember(id){
  if(!confirm("Reject this membership application?"))return;
  try{await TBOP.api.setMemberStatus(id,"rejected");await renderApprovalCenter();if(window.refreshDbModules)await refreshDbModules()}
  catch(e){alert("Could not reject member: "+(e.message||e))}
}
window.approveMember=approveMember;window.rejectMember=rejectMember;
document.addEventListener("DOMContentLoaded",()=>{renderApprovalCenter();});
