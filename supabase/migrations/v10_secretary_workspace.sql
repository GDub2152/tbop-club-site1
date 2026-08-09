-- TBOP V10: Secretary workspace persistence + RLS
-- Run after V9 migration.

-- Expand meetings with structured secretary fields.
alter table public.meetings
  add column if not exists meeting_time time,
  add column if not exists treasurer_report text,
  add column if not exists committee_reports text,
  add column if not exists old_business text,
  add column if not exists new_business text,
  add column if not exists announcements text,
  add column if not exists adjourn_time time,
  add column if not exists updated_at timestamptz not null default now();

-- Agenda items.
create table if not exists public.meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  sort_order integer not null default 0,
  item_text text not null,
  created_at timestamptz not null default now()
);

-- Free-form attendance, because guests may not have a member profile.
create table if not exists public.meeting_attendance_entries (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  checked_in_at timestamptz not null default now()
);

-- Motions already exist from the base schema; add ordering if missing.
alter table public.motions
  add column if not exists sort_order integer not null default 0;

-- Enable RLS.
alter table public.meeting_agenda_items enable row level security;
alter table public.meeting_attendance_entries enable row level security;

-- Secretary/administrative role helper.
create or replace function public.can_manage_secretary()
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
      'admin'::public.club_role
    )
    from public.profiles
    where id = auth.uid()),
    false
  );
$$;

grant execute on function public.can_manage_secretary() to authenticated;

-- Meetings policies.
drop policy if exists "secretary roles can read meetings" on public.meetings;
drop policy if exists "secretary roles can create meetings" on public.meetings;
drop policy if exists "secretary roles can update meetings" on public.meetings;
drop policy if exists "secretary roles can delete meetings" on public.meetings;

create policy "secretary roles can read meetings"
on public.meetings for select
to authenticated
using (public.can_manage_secretary());

create policy "secretary roles can create meetings"
on public.meetings for insert
to authenticated
with check (public.can_manage_secretary());

create policy "secretary roles can update meetings"
on public.meetings for update
to authenticated
using (public.can_manage_secretary())
with check (public.can_manage_secretary());

create policy "secretary roles can delete meetings"
on public.meetings for delete
to authenticated
using (public.can_manage_secretary());

-- Agenda policies.
drop policy if exists "secretary roles manage agenda" on public.meeting_agenda_items;
create policy "secretary roles manage agenda"
on public.meeting_agenda_items
for all
to authenticated
using (public.can_manage_secretary())
with check (public.can_manage_secretary());

-- Attendance policies.
drop policy if exists "secretary roles manage attendance" on public.meeting_attendance_entries;
create policy "secretary roles manage attendance"
on public.meeting_attendance_entries
for all
to authenticated
using (public.can_manage_secretary())
with check (public.can_manage_secretary());

-- Motions policies.
drop policy if exists "secretary roles can read motions" on public.motions;
drop policy if exists "secretary roles can create motions" on public.motions;
drop policy if exists "secretary roles can update motions" on public.motions;
drop policy if exists "secretary roles can delete motions" on public.motions;

create policy "secretary roles can read motions"
on public.motions for select
to authenticated
using (public.can_manage_secretary());

create policy "secretary roles can create motions"
on public.motions for insert
to authenticated
with check (public.can_manage_secretary());

create policy "secretary roles can update motions"
on public.motions for update
to authenticated
using (public.can_manage_secretary())
with check (public.can_manage_secretary());

create policy "secretary roles can delete motions"
on public.motions for delete
to authenticated
using (public.can_manage_secretary());

-- Audit helper.
create or replace function public.audit_meeting_change(
  target_meeting uuid,
  action_name text,
  details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_secretary() then
    raise exception 'not authorized';
  end if;

  insert into public.audit_log(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), action_name, 'meeting', target_meeting::text, details);
end;
$$;

grant execute on function public.audit_meeting_change(uuid,text,jsonb) to authenticated;

create index if not exists meetings_meeting_date_idx on public.meetings(meeting_date);
create index if not exists meetings_status_idx on public.meetings(status);
create index if not exists agenda_meeting_idx on public.meeting_agenda_items(meeting_id,sort_order);
create index if not exists attendance_meeting_idx on public.meeting_attendance_entries(meeting_id);
create index if not exists motions_meeting_idx on public.motions(meeting_id,sort_order);
