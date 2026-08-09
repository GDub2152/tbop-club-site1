
window.TBOP = window.TBOP || {};

(function(){
  const DEMO_KEY="tbop_demo_session";
  const officerRoles=new Set([
    "president","vice_president","secretary","treasurer",
    "sergeant_at_arms","trustee","repeater_trustee","admin"
  ]);

  async function realSession(){
    if(!window.TBOP.api?.configured()) return null;
    try{return await window.TBOP.api.getSession()}catch(e){console.error(e);return null}
  }

  async function realProfile(){
    if(!window.TBOP.api?.configured()) return null;
    try{return await window.TBOP.api.getMyProfile()}catch(e){console.error(e);return null}
  }

  function demoSession(){
    try{return JSON.parse(sessionStorage.getItem(DEMO_KEY)||"null")}catch(e){return null}
  }

  async function currentUser(){
    const session=await realSession();
    if(session){
      const profile=await realProfile();
      return {
        mode:"real",
        email:session.user.email,
        id:session.user.id,
        role:profile?.role || "member",
        name:profile?.display_name || session.user.email || "Member",
        profile
      };
    }
    const demo=demoSession();
    if(demo){
      return {
        mode:"demo",
        email:demo.email,
        role:demo.role||"member",
        name:demo.name||"Demo Member"
      };
    }
    return null;
  }

  function isOfficer(role){return officerRoles.has(role)}

  async function requirePortal(kind){
    const user=await currentUser();
    if(!user){
      location.href="login.html";
      return null;
    }
    if(kind==="officer" && !isOfficer(user.role)){
      location.href="member.html";
      return null;
    }
    return user;
  }

  window.TBOP.auth={currentUser,isOfficer,requirePortal};
})();
