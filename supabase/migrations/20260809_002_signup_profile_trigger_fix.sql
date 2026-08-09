-- TBOP 14.0.2 - Signup Profile Trigger Fix
-- Creates the public.profiles record server-side when Supabase Auth creates
-- a new auth.users row. This works even when email confirmation is enabled.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  md jsonb;
  v_first text;
  v_last text;
  v_display text;
  v_callsign text;
begin
  md := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  v_first := nullif(trim(md->>'first_name'),'');
  v_last := nullif(trim(md->>'last_name'),'');
  v_display := nullif(trim(md->>'display_name'),'');
  if v_display is null then
    v_display := nullif(trim(concat_ws(' ',v_first,v_last)),'');
  end if;
  if v_display is null then
    v_display := split_part(new.email,'@',1);
  end if;

  v_callsign := nullif(upper(trim(coalesce(md->>'callsign',''))),'');

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    callsign,
    mobile_phone,
    city,
    state,
    role,
    membership_status,
    dues_status,
    voting_eligible
  )
  values (
    new.id,
    new.email,
    v_first,
    v_last,
    v_display,
    v_callsign,
    nullif(trim(md->>'mobile_phone'),''),
    nullif(trim(md->>'city'),''),
    nullif(upper(trim(coalesce(md->>'state',''))),''),
    'member'::public.club_role,
    'pending',
    'unpaid',
    false
  )
  on conflict (id) do update
  set email=excluded.email,
      first_name=coalesce(public.profiles.first_name,excluded.first_name),
      last_name=coalesce(public.profiles.last_name,excluded.last_name),
      display_name=coalesce(nullif(public.profiles.display_name,''),excluded.display_name),
      callsign=coalesce(public.profiles.callsign,excluded.callsign),
      mobile_phone=coalesce(public.profiles.mobile_phone,excluded.mobile_phone),
      city=coalesce(public.profiles.city,excluded.city),
      state=coalesce(public.profiles.state,excluded.state),
      updated_at=now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

commit;
