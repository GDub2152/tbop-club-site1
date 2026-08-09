
function memberBoolValue(v){return v===true?"true":v===false?"false":""}
async function loadMyProfile(){
  if(!window.TBOP?.api?.configured?.())return;
  try{
    const p=await TBOP.api.getMyProfile();
    if(!p)return;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??""};
    set("myFirstName",p.first_name);set("myLastName",p.last_name);set("myDisplayName",p.display_name);
    set("myCallsign",p.callsign);set("myMobilePhone",p.mobile_phone);set("myHomePhone",p.home_phone);
    set("myAddress1",p.address1);set("myAddress2",p.address2);set("myCity",p.city);set("myState",p.state);set("myZip",p.zip);
    set("myLicenseClass",p.license_class);set("myLicenseExpiration",p.license_expiration);
    set("myArrlMember",memberBoolValue(p.arrl_member));set("myTextingAllowed",memberBoolValue(p.texting_allowed));
    const summary=document.getElementById("myMembershipSummary");
    if(summary)summary.innerHTML=`<p><strong>Status:</strong> ${p.membership_status||"pending"}</p><p><strong>Dues:</strong> ${p.dues_status||"unpaid"}</p><p><strong>Voting:</strong> ${p.voting_eligible?"Eligible":"Not eligible"}</p><p><strong>Role:</strong> ${(p.role||"member").replaceAll("_"," ")}</p>`;
  }catch(e){console.error(e)}
}
document.addEventListener("DOMContentLoaded",()=>{
  loadMyProfile();
  document.getElementById("myProfileForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const b=id=>{const v=document.getElementById(id).value;return v==="true"?true:v==="false"?false:null};
    try{
      await TBOP.api.updateMyProfile({
        first_name:myFirstName.value.trim()||null,last_name:myLastName.value.trim()||null,
        display_name:myDisplayName.value.trim()||null,callsign:myCallsign.value.trim()||null,
        mobile_phone:myMobilePhone.value.trim()||null,home_phone:myHomePhone.value.trim()||null,
        address1:myAddress1.value.trim()||null,address2:myAddress2.value.trim()||null,
        city:myCity.value.trim()||null,state:myState.value.trim().toUpperCase()||null,zip:myZip.value.trim()||null,
        license_class:myLicenseClass.value.trim()||null,license_expiration:myLicenseExpiration.value||null,
        arrl_member:b("myArrlMember"),texting_allowed:b("myTextingAllowed")
      });
      alert("Profile updated.");
      await loadMyProfile();
    }catch(err){alert("Could not update profile: "+(err.message||err))}
  });
});
