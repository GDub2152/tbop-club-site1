
window.TBOP = window.TBOP || {};

(function(){
  function configured(){
    return Boolean(window.TBOP?.backendConfigured && window.TBOP?.supabase);
  }

  async function signIn(email,password){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase.auth.signInWithPassword({email,password});
    if(error) throw error;
    return data;
  }

  async function signOut(){
    if(!configured()) return;
    const {error}=await window.TBOP.supabase.auth.signOut();
    if(error) throw error;
  }

  async function getSession(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase.auth.getSession();
    if(error) throw error;
    return data.session || null;
  }

  async function getMyProfile(){
    if(!configured()) return null;
    const session=await getSession();
    if(!session) return null;
    const {data,error}=await window.TBOP.supabase
      .from("profiles")
      .select("*")
      .eq("id",session.user.id)
      .single();
    if(error) throw error;
    return data;
  }

  async function listPublicEvents(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("events")
      .select("*")
      .eq("visibility","public")
      .order("starts_at",{ascending:true});
    if(error) throw error;
    return data;
  }

  async function listMyAccessibleEvents(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("events")
      .select("*")
      .order("starts_at",{ascending:true});
    if(error) throw error;
    return data;
  }

  async function listElections(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("elections")
      .select("*, election_positions(*, candidates(*))")
      .in("status",["open","draft"])
      .order("created_at",{ascending:false});
    if(error) throw error;
    return data;
  }

  async function createEvent(event){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("events")
      .insert(event)
      .select()
      .single();
    if(error) throw error;
    return data;
  }

  async function createProfileIfMissing(user,displayName){
    if(!configured()) return null;
    const {data:existing,error:readError}=await window.TBOP.supabase
      .from("profiles")
      .select("*")
      .eq("id",user.id)
      .maybeSingle();
    if(readError) throw readError;
    if(existing) return existing;

    const {data,error}=await window.TBOP.supabase
      .from("profiles")
      .insert({
        id:user.id,
        display_name:displayName || user.email || "Member",
        email:user.email,
        role:"member",
        membership_status:"pending",
        dues_status:"unpaid",
        voting_eligible:false
      })
      .select()
      .single();
    if(error) throw error;
    return data;
  }

  window.TBOP.api={
    configured,
    signIn,
    signOut,
    getSession,
    getMyProfile,
    listPublicEvents,
    listMyAccessibleEvents,
    listElections,
    createEvent,
    createProfileIfMissing
  };
})();
