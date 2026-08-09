-- TBOP 14.0.0 - Member Self-Service & Approval Center
begin;

-- Allow pending members to exist safely.
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

-- New signups are always members/pending/unpaid/non-voting.
create or replace function public.tbop_profile_defaults()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.role is null then
    new.role := 'member'::public.club_role;
  end if;
  if new.membership_status is null then
    new.membership_status := 'pending';
  end if;
  if new.dues_status is null then
    new.dues_status := 'unpaid';
  end if;
  if new.voting_eligible is null then
    new.voting_eligible := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tbop_profile_defaults on public.profiles;
create trigger trg_tbop_profile_defaults
before insert on public.profiles
for each row execute function public.tbop_profile_defaults();

-- Members may update only their own personal/contact/profile fields.
create or replace function public.tbop_update_my_profile(
  p_first_name text default null,
  p_last_name text default null,
  p_display_name text default null,
  p_callsign text default null,
  p_mobile_phone text default null,
  p_home_phone text default null,
  p_address1 text default null,
  p_address2 text default null,
  p_city text default null,
  p_state text default null,
  p_zip text default null,
  p_license_class text default null,
  p_license_expiration date default null,
  p_arrl_member boolean default null,
  p_texting_allowed boolean default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  update public.profiles
  set first_name=p_first_name,
      last_name=p_last_name,
      display_name=coalesce(nullif(p_display_name,''), trim(concat_ws(' ',p_first_name,p_last_name))),
      callsign=nullif(upper(trim(coalesce(p_callsign,''))),''),
      mobile_phone=nullif(p_mobile_phone,''),
      home_phone=nullif(p_home_phone,''),
      address1=nullif(p_address1,''),
      address2=nullif(p_address2,''),
      city=nullif(p_city,''),
      state=nullif(p_state,''),
      zip=nullif(p_zip,''),
      license_class=nullif(p_license_class,''),
      license_expiration=p_license_expiration,
      arrl_member=p_arrl_member,
      texting_allowed=p_texting_allowed,
      updated_at=now()
  where id=auth.uid();
end;
$$;

grant execute on function public.tbop_update_my_profile(
  text,text,text,text,text,text,text,text,text,text,text,text,date,boolean,boolean
) to authenticated;

-- Executive approval/rejection helper.
create or replace function public.tbop_set_member_status(
  p_member uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not public.tbop_is_executive() then raise exception 'Not authorized'; end if;
  if p_status not in ('pending','active','inactive','rejected') then
    raise exception 'Invalid member status';
  end if;

  update public.profiles
  set membership_status=p_status,
      voting_eligible=case when p_status='active' then voting_eligible else false end,
      updated_at=now()
  where id=p_member;
end;
$$;

grant execute on function public.tbop_set_member_status(uuid,text) to authenticated;

commit;
