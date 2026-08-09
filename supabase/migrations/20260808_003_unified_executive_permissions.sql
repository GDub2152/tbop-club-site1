-- TBOP Beta 2.5 - Unified Executive Permissions
-- President, Vice President, Secretary, Treasurer, Sergeant at Arms
-- receive full operational/admin-equivalent club access.
-- Trustees remain more limited.
-- Technical `admin` remains a separate recovery/system role.

begin;

create or replace function public.tbop_is_executive()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    (
      select p.role in (
        'president'::public.club_role,
        'vice_president'::public.club_role,
        'secretary'::public.club_role,
        'treasurer'::public.club_role,
        'sergeant_at_arms'::public.club_role,
        'admin'::public.club_role
      )
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select public.tbop_is_executive();
$$;

create or replace function public.can_manage_system_settings()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select public.tbop_is_executive();
$$;

create or replace function public.can_manage_secretary()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select public.tbop_is_executive();
$$;

create or replace function public.can_manage_finances()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select public.tbop_is_executive();
$$;

create or replace function public.can_manage_voting()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select public.tbop_is_executive();
$$;

create or replace function public.can_manage_repeater()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    public.tbop_is_executive()
    or exists (
      select 1 from public.profiles p
      where p.id=auth.uid()
        and p.role='repeater_trustee'::public.club_role
    ),
    false
  );
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select public.tbop_is_executive();
$$;

create or replace function public.can_manage_equipment()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    public.tbop_is_executive()
    or exists (
      select 1 from public.profiles p
      where p.id=auth.uid()
        and p.role='repeater_trustee'::public.club_role
    ),
    false
  );
$$;

grant execute on function public.tbop_is_executive() to authenticated;
grant execute on function public.is_club_admin() to authenticated;
grant execute on function public.can_manage_system_settings() to authenticated;
grant execute on function public.can_manage_secretary() to authenticated;
grant execute on function public.can_manage_finances() to authenticated;
grant execute on function public.can_manage_voting() to authenticated;
grant execute on function public.can_manage_repeater() to authenticated;
grant execute on function public.can_manage_content() to authenticated;
grant execute on function public.can_manage_equipment() to authenticated;

commit;
