
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


  async function listProfiles(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("profiles")
      .select("*")
      .order("display_name",{ascending:true});
    if(error) throw error;
    return data;
  }

  async function createProfile(profile){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();
    if(error) throw error;
    return data;
  }

  async function updateProfile(id,changes){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("profiles")
      .update(changes)
      .eq("id",id)
      .select()
      .single();
    if(error) throw error;
    return data;
  }

  async function deleteProfile(id){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase
      .from("profiles")
      .delete()
      .eq("id",id);
    if(error) throw error;
  }

  async function auditProfileChange(id,action,details={}){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase.rpc("audit_profile_change",{
      target_profile:id,
      action_name:action,
      details
    });
    if(error) throw error;
  }

  async function updateEvent(id,changes){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("events")
      .update(changes)
      .eq("id",id)
      .select()
      .single();
    if(error) throw error;
    return data;
  }

  async function deleteEvent(id){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase
      .from("events")
      .delete()
      .eq("id",id);
    if(error) throw error;
  }


  async function listMeetings(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("meetings")
      .select("*")
      .order("meeting_date",{ascending:false});
    if(error) throw error;
    return data;
  }

  async function getMeeting(id){
    if(!configured()) return null;
    const [meetingRes, agendaRes, attendanceRes, motionsRes] = await Promise.all([
      window.TBOP.supabase.from("meetings").select("*").eq("id",id).single(),
      window.TBOP.supabase.from("meeting_agenda_items").select("*").eq("meeting_id",id).order("sort_order"),
      window.TBOP.supabase.from("meeting_attendance_entries").select("*").eq("meeting_id",id).order("checked_in_at"),
      window.TBOP.supabase.from("motions").select("*").eq("meeting_id",id).order("sort_order")
    ]);
    if(meetingRes.error) throw meetingRes.error;
    if(agendaRes.error) throw agendaRes.error;
    if(attendanceRes.error) throw attendanceRes.error;
    if(motionsRes.error) throw motionsRes.error;
    return {
      ...meetingRes.data,
      agenda:agendaRes.data||[],
      attendance:attendanceRes.data||[],
      motions:motionsRes.data||[]
    };
  }

  async function createMeeting(row){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase.from("meetings").insert(row).select().single();
    if(error) throw error;
    return data;
  }

  async function updateMeeting(id,row){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("meetings").update(row).eq("id",id).select().single();
    if(error) throw error;
    return data;
  }

  async function deleteMeeting(id){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase.from("meetings").delete().eq("id",id);
    if(error) throw error;
  }

  async function replaceMeetingAgenda(meetingId,items){
    if(!configured()) throw new Error("Backend not configured");
    const del=await window.TBOP.supabase.from("meeting_agenda_items").delete().eq("meeting_id",meetingId);
    if(del.error) throw del.error;
    if(!items.length) return [];
    const rows=items.map((item_text,sort_order)=>({meeting_id:meetingId,item_text,sort_order}));
    const {data,error}=await window.TBOP.supabase.from("meeting_agenda_items").insert(rows).select();
    if(error) throw error;
    return data;
  }

  async function replaceMeetingAttendance(meetingId,items){
    if(!configured()) throw new Error("Backend not configured");
    const del=await window.TBOP.supabase.from("meeting_attendance_entries").delete().eq("meeting_id",meetingId);
    if(del.error) throw del.error;
    if(!items.length) return [];
    const rows=items.map(display_name=>({meeting_id:meetingId,display_name}));
    const {data,error}=await window.TBOP.supabase.from("meeting_attendance_entries").insert(rows).select();
    if(error) throw error;
    return data;
  }

  async function replaceMeetingMotions(meetingId,items){
    if(!configured()) throw new Error("Backend not configured");
    const del=await window.TBOP.supabase.from("motions").delete().eq("meeting_id",meetingId);
    if(del.error) throw del.error;
    if(!items.length) return [];
    const rows=items.map((m,sort_order)=>({
      meeting_id:meetingId,
      motion_text:m.text,
      moved_by:m.by||null,
      seconded_by:m.second||null,
      result:m.result||null,
      sort_order
    }));
    const {data,error}=await window.TBOP.supabase.from("motions").insert(rows).select();
    if(error) throw error;
    return data;
  }

  async function auditMeetingChange(id,action,details={}){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase.rpc("audit_meeting_change",{
      target_meeting:id,
      action_name:action,
      details
    });
    if(error) throw error;
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
    updateEvent,
    deleteEvent,
    listProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    auditProfileChange,
    listMeetings,
    getMeeting,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    replaceMeetingAgenda,
    replaceMeetingAttendance,
    replaceMeetingMotions,
    auditMeetingChange,
    createProfileIfMissing
  };
})();
