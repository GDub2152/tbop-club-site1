-- TBOP V8: Role helpers + RLS policies for profiles and events
-- Run this in Supabase SQL Editor after the base schema.

create or replace function public.current_club_role()
returns public.club_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'admin'::public.club_role
     from public.profiles
     where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role in (
      'president'::public.club_role,
      'vice_president'::public.club_role,
      'secretary'::public.club_role,
      'treasurer'::public.club_role,
      'sergeant_at_arms'::public.club_role,
      'trustee'::public.club_role,
      'repeater_trustee'::public.club_role,
      'admin'::public.club_role
    )
    from public.profiles
    where id = auth.uid()),
    false
  );
$$;

grant execute on function public.current_club_role() to authenticated;
grant execute on function public.is_club_admin() to authenticated;
grant execute on function public.is_officer() to authenticated;

-- Profiles
drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "admins can read all profiles" on public.profiles;
drop policy if exists "admins can insert profiles" on public.profiles;
drop policy if exists "admins can update profiles" on public.profiles;
drop policy if exists "admins can delete profiles" on public.profiles;

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "users can update own basic profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins can read all profiles"
on public.profiles for select
to authenticated
using (public.is_club_admin());

create policy "admins can insert profiles"
on public.profiles for insert
to authenticated
with check (public.is_club_admin());

create policy "admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_club_admin())
with check (public.is_club_admin());

create policy "admins can delete profiles"
on public.profiles for delete
to authenticated
using (public.is_club_admin());

-- Events
drop policy if exists "public can read public events" on public.events;
drop policy if exists "authenticated can read member events" on public.events;
drop policy if exists "officers can read officer events" on public.events;
drop policy if exists "officers can create events" on public.events;
drop policy if exists "officers can update events" on public.events;
drop policy if exists "officers can delete events" on public.events;

create policy "public can read public events"
on public.events for select
to anon, authenticated
using (visibility = 'public');

create policy "authenticated can read member events"
on public.events for select
to authenticated
using (visibility in ('public','members'));

create policy "officers can read officer events"
on public.events for select
to authenticated
using (public.is_officer());

create policy "officers can create events"
on public.events for insert
to authenticated
with check (public.is_officer());

create policy "officers can update events"
on public.events for update
to authenticated
using (public.is_officer())
with check (public.is_officer());

create policy "officers can delete events"
on public.events for delete
to authenticated
using (public.is_officer());

-- Helpful indexes
create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists events_visibility_idx on public.events(visibility);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_membership_status_idx on public.profiles(membership_status);
