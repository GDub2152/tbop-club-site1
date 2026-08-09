
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


  async function listTransactions(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("financial_transactions")
      .select("*, profiles(display_name,callsign)")
      .order("transaction_date",{ascending:false})
      .order("created_at",{ascending:false});
    if(error) throw error;
    return data;
  }

  async function createTransaction(row){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("financial_transactions")
      .insert(row).select("*, profiles(display_name,callsign)").single();
    if(error) throw error;
    return data;
  }

  async function deleteTransaction(id){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase
      .from("financial_transactions").delete().eq("id",id);
    if(error) throw error;
  }

  async function listBudgets(year){
    if(!configured()) return null;
    let q=window.TBOP.supabase.from("budget_items").select("*").order("category");
    if(year) q=q.eq("fiscal_year",year);
    const {data,error}=await q;
    if(error) throw error;
    return data;
  }

  async function upsertBudget(row){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("budget_items")
      .upsert(row,{onConflict:"fiscal_year,category,budget_type"})
      .select().single();
    if(error) throw error;
    return data;
  }

  async function deleteBudget(id){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase
      .from("budget_items").delete().eq("id",id);
    if(error) throw error;
  }

  async function listMembershipPayments(){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("membership_payments")
      .select("*, profiles(display_name,callsign)")
      .order("paid_on",{ascending:false});
    if(error) throw error;
    return data;
  }

  async function createMembershipPayment(row){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("membership_payments")
      .insert(row)
      .select("*, profiles(display_name,callsign)")
      .single();
    if(error) throw error;
    return data;
  }

  async function deleteMembershipPayment(id){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase
      .from("membership_payments").delete().eq("id",id);
    if(error) throw error;
  }

  async function auditFinancialChange(kind,id,action,details={}){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase.rpc("audit_financial_change",{
      entity_kind:kind,
      entity_key:id,
      action_name:action,
      details
    });
    if(error) throw error;
  }


  async function getFeatureFlag(key){
    if(!configured()) return null;
    const {data,error}=await window.TBOP.supabase
      .from("feature_flags")
      .select("*")
      .eq("feature_key",key)
      .single();
    if(error) throw error;
    return data;
  }

  async function setFeatureFlag(key,enabled,configuration=null){
    if(!configured()) throw new Error("Backend not configured");
    const session=await getSession();
    const row={
      feature_key:key,
      enabled:Boolean(enabled),
      updated_by:session?.user?.id||null,
      updated_at:new Date().toISOString()
    };
    if(configuration!==null)row.configuration=configuration;
    const {data,error}=await window.TBOP.supabase
      .from("feature_flags")
      .upsert(row,{onConflict:"feature_key"})
      .select()
      .single();
    if(error) throw error;
    return data;
  }

  async function createElection(row){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("elections").insert(row).select().single();
    if(error) throw error;
    return data;
  }

  async function updateElection(id,row){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase
      .from("elections").update(row).eq("id",id).select().single();
    if(error) throw error;
    return data;
  }

  async function deleteElection(id){
    if(!configured()) throw new Error("Backend not configured");
    const {error}=await window.TBOP.supabase.from("elections").delete().eq("id",id);
    if(error) throw error;
  }

  async function replaceElectionPositions(electionId,positions){
    if(!configured()) throw new Error("Backend not configured");
    const del=await window.TBOP.supabase.from("election_positions").delete().eq("election_id",electionId);
    if(del.error) throw del.error;
    for(let i=0;i<positions.length;i++){
      const p=positions[i];
      const {data:pos,error}=await window.TBOP.supabase
        .from("election_positions")
        .insert({
          election_id:electionId,
          office_name:p.office,
          seat_count:p.seat_count||1,
          sort_order:i,
          allow_write_in:p.allow_write_in!==false
        }).select().single();
      if(error) throw error;
      if(p.candidates?.length){
        const rows=p.candidates.map((name,j)=>({
          position_id:pos.id,
          candidate_name:name,
          sort_order:j
        }));
        const c=await window.TBOP.supabase.from("candidates").insert(rows);
        if(c.error) throw c.error;
      }
    }
  }

  async function castBallot(electionId,choices){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase.rpc("cast_ballot",{
      p_election:electionId,
      p_choices:choices
    });
    if(error) throw error;
    return data;
  }

  async function getElectionResults(electionId){
    if(!configured()) throw new Error("Backend not configured");
    const {data,error}=await window.TBOP.supabase.rpc("get_election_results",{
      p_election:electionId
    });
    if(error) throw error;
    return data;
  }


  async function listRepeaterAssets(){
    const {data,error}=await window.TBOP.supabase.from("repeater_assets").select("*").order("name");
    if(error)throw error; return data;
  }
  async function createRepeaterAsset(row){
    const {data,error}=await window.TBOP.supabase.from("repeater_assets").insert(row).select().single();
    if(error)throw error; return data;
  }
  async function listRepeaterMaintenance(){
    const {data,error}=await window.TBOP.supabase.from("repeater_maintenance").select("*, repeater_assets(name)").order("maintenance_date",{ascending:false});
    if(error)throw error; return data;
  }
  async function createRepeaterMaintenance(row){
    const {data,error}=await window.TBOP.supabase.from("repeater_maintenance").insert(row).select().single();
    if(error)throw error; return data;
  }
  async function listEquipment(){
    const {data,error}=await window.TBOP.supabase.from("equipment_inventory").select("*").order("name");
    if(error)throw error; return data;
  }
  async function createEquipment(row){
    const {data,error}=await window.TBOP.supabase.from("equipment_inventory").insert(row).select().single();
    if(error)throw error; return data;
  }
  async function listNews(publicOnly=false){
    let q=window.TBOP.supabase.from("news_posts").select("*").order("pinned",{ascending:false}).order("publish_at",{ascending:false});
    if(publicOnly)q=q.eq("status","published").eq("visibility","public");
    const {data,error}=await q;if(error)throw error;return data;
  }
  async function createNews(row){
    const {data,error}=await window.TBOP.supabase.from("news_posts").insert(row).select().single();
    if(error)throw error;return data;
  }
  async function listApprovals(){
    const {data,error}=await window.TBOP.supabase.from("document_approvals").select("*").order("created_at",{ascending:false});
    if(error)throw error;return data;
  }
  async function createApproval(row){
    const {data,error}=await window.TBOP.supabase.from("document_approvals").insert(row).select().single();
    if(error)throw error;return data;
  }
  async function updateApproval(id,row){
    const {data,error}=await window.TBOP.supabase.from("document_approvals").update(row).eq("id",id).select().single();
    if(error)throw error;return data;
  }
  async function getMyMembershipCard(){
    const session=await getSession();if(!session)return null;
    const {data,error}=await window.TBOP.supabase.from("membership_cards").select("*").eq("profile_id",session.user.id).maybeSingle();
    if(error)throw error;return data;
  }
  async function exportReadableData(){
    const tables=["profiles","events","meetings","motions","financial_transactions","budget_items","membership_payments","repeater_assets","repeater_maintenance","equipment_inventory","news_posts","document_approvals"];
    const out={exported_at:new Date().toISOString(),tables:{}};
    for(const table of tables){
      const {data,error}=await window.TBOP.supabase.from(table).select("*");
      out.tables[table]=error?{error:error.message}:data;
    }
    return out;
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
    listTransactions,
    createTransaction,
    deleteTransaction,
    listBudgets,
    upsertBudget,
    deleteBudget,
    listMembershipPayments,
    createMembershipPayment,
    deleteMembershipPayment,
    auditFinancialChange,
    getFeatureFlag,
    setFeatureFlag,
    createElection,
    updateElection,
    deleteElection,
    replaceElectionPositions,
    castBallot,
    getElectionResults,
    listRepeaterAssets,
    createRepeaterAsset,
    listRepeaterMaintenance,
    createRepeaterMaintenance,
    listEquipment,
    createEquipment,
    listNews,
    createNews,
    listApprovals,
    createApproval,
    updateApproval,
    getMyMembershipCard,
    exportReadableData,
    createProfileIfMissing
  };
})();
