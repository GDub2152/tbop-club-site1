-- TBOP V9: Member/admin management hardening + audit helper
-- Run after V8 migration.

-- Add optional membership fields.
alter table public.profiles
  add column if not exists license_class text,
  add column if not exists license_expiration date,
  add column if not exists arrl_member boolean,
  add column if not exists texting_allowed boolean,
  add column if not exists address1 text,
  add column if not exists address2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists home_phone text,
  add column if not exists mobile_phone text,
  add column if not exists joined_on date,
  add column if not exists membership_notes text;

-- Prevent ordinary users from changing privileged fields through self-update.
-- Replace permissive self-update policy with a column-safe RPC path later;
-- for now, disable direct self update and let admins manage profiles.
drop policy if exists "users can update own basic profile" on public.profiles;

-- Admins retain full profile update policy from V8.

create or replace function public.audit_profile_change(
  target_profile uuid,
  action_name text,
  details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_club_admin() then
    raise exception 'not authorized';
  end if;

  insert into public.audit_log(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), action_name, 'profile', target_profile::text, details);
end;
$$;

grant execute on function public.audit_profile_change(uuid,text,jsonb) to authenticated;

create index if not exists profiles_callsign_idx on public.profiles(callsign);
create index if not exists profiles_dues_status_idx on public.profiles(dues_status);
create index if not exists profiles_voting_eligible_idx on public.profiles(voting_eligible);
