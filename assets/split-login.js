
window.TBOP = window.TBOP || {};

(function(){
  const DEMO_KEY="tbop_demo_session";
  const officerRoles=new Set([
    "president","vice_president","secretary","treasurer",
    "sergeant_at_arms","trustee","repeater_trustee","admin"
  ]);

  function roleLabel(role){
    return (role||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
  }

  async function signInReal(email,password){
    const data=await window.TBOP.api.signIn(email,password);
    await window.TBOP.api.createProfileIfMissing(data.user,email.split("@")[0]||"Member");
    return await window.TBOP.api.getMyProfile();
  }

  async function memberLogin(e){
    e.preventDefault();
    const email=document.getElementById("memberLoginEmail").value.trim();
    const password=document.getElementById("memberLoginPassword").value;
    const btn=document.getElementById("memberLoginBtn");

    if(window.TBOP.api?.configured()){
      try{
        btn.disabled=true;btn.textContent="Signing in…";
        await signInReal(email,password);
        // Officers are also allowed to use the member-facing portal when desired.
        location.href="member.html";
      }catch(err){
        alert("Sign in failed: "+(err.message||err));
        btn.disabled=false;btn.textContent="Enter Member Portal";
      }
      return;
    }

    sessionStorage.setItem(DEMO_KEY,JSON.stringify({
      role:"member",email,name:"Demo Member",demo:true
    }));
    location.href="member.html";
  }

  async function officerLogin(e){
    e.preventDefault();
    const email=document.getElementById("officerLoginEmail").value.trim();
    const password=document.getElementById("officerLoginPassword").value;
    const expected=document.getElementById("officerLoginRole").value;
    const btn=document.getElementById("officerLoginBtn");

    if(window.TBOP.api?.configured()){
      try{
        btn.disabled=true;btn.textContent="Signing in…";
        const profile=await signInReal(email,password);
        const actual=profile?.role||"member";

        if(!officerRoles.has(actual)){
          await window.TBOP.api.signOut();
          throw new Error("This account is a general member account. Please use Member Login.");
        }

        if(expected!=="auto" && expected!==actual){
          await window.TBOP.api.signOut();
          throw new Error(
            `This account is assigned as ${roleLabel(actual)}, not ${roleLabel(expected)}.`
          );
        }

        location.href="portal.html";
      }catch(err){
        alert("Officer sign in failed: "+(err.message||err));
        btn.disabled=false;btn.textContent="Enter Officer Portal";
      }
      return;
    }

    const demoRole=expected==="auto"?"president":expected;
    sessionStorage.setItem(DEMO_KEY,JSON.stringify({
      role:demoRole,email,name:"Demo Officer",demo:true
    }));
    location.href="portal.html";
  }

  document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("memberLoginForm")?.addEventListener("submit",memberLogin);
    document.getElementById("officerLoginForm")?.addEventListener("submit",officerLogin);

    const memberNotice=document.getElementById("memberAuthModeNotice");
    const officerNotice=document.getElementById("officerAuthModeNotice");
    const secure=Boolean(window.TBOP.api?.configured());

    if(memberNotice){
      memberNotice.textContent=secure
        ?"SECURE MEMBER LOGIN — connected to Supabase."
        :"DEMO MEMBER LOGIN — Supabase is not configured.";
      if(secure)memberNotice.classList.add("secure-auth-notice");
    }
    if(officerNotice){
      officerNotice.textContent=secure
        ?"SECURE OFFICER LOGIN — your selected role is verified against Supabase."
        :"DEMO OFFICER LOGIN — choose a role to preview the Officer Portal.";
      if(secure)officerNotice.classList.add("secure-auth-notice");
    }
  });
})();
