-- TBOP Club Management System
-- Supabase/PostgreSQL starter schema
-- Review and test before production use.

create extension if not exists pgcrypto;

create type public.club_role as enum (
  'member',
  'president',
  'vice_president',
  'secretary',
  'treasurer',
  'sergeant_at_arms',
  'trustee',
  'repeater_trustee',
  'admin'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  callsign text,
  email text,
  phone text,
  role public.club_role not null default 'member',
  membership_status text not null default 'pending',
  dues_status text not null default 'unpaid',
  voting_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  location text,
  visibility text not null default 'public'
    check (visibility in ('public','members','officers')),
  recurrence text not null default 'none',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  location text,
  presiding_officer text,
  secretary text,
  minutes_text text,
  status text not null default 'draft'
    check (status in ('draft','pending_approval','approved','published')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.meeting_attendance (
  meeting_id uuid references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  primary key (meeting_id, profile_id)
);

create table public.motions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  motion_text text not null,
  moved_by text,
  seconded_by text,
  result text,
  created_at timestamptz not null default now()
);

create table public.elections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  opens_at timestamptz,
  closes_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft','open','closed','archived')),
  allow_write_ins boolean not null default true,
  results_visibility text not null default 'after_close'
    check (results_visibility in ('live','after_close')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.election_positions (
  id uuid primary key default gen_random_uuid(),
  election_id uuid references public.elections(id) on delete cascade,
  office_name text not null,
  seat_count integer not null default 1
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  position_id uuid references public.election_positions(id) on delete cascade,
  candidate_name text not null
);

-- Eligibility/receipt table deliberately does NOT contain ballot choices.
create table public.voter_receipts (
  election_id uuid references public.elections(id) on delete cascade,
  voter_id uuid references auth.users(id) on delete cascade,
  voted_at timestamptz,
  primary key (election_id, voter_id)
);

-- Ballot rows deliberately do NOT contain voter_id.
-- For stronger anonymity in production, use an RPC/edge function that validates
-- eligibility and writes receipt + anonymous ballot inside one transaction.
create table public.ballots (
  id uuid primary key default gen_random_uuid(),
  election_id uuid references public.elections(id) on delete cascade,
  position_id uuid references public.election_positions(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  write_in_text text,
  submitted_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text not null,
  visibility text not null default 'members'
    check (visibility in ('public','members','officers','treasurer','repeater_trustee')),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.repeater_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_date date,
  status text not null default 'open',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.meetings enable row level security;
alter table public.motions enable row level security;
alter table public.elections enable row level security;
alter table public.election_positions enable row level security;
alter table public.candidates enable row level security;
alter table public.voter_receipts enable row level security;
alter table public.ballots enable row level security;
alter table public.documents enable row level security;
alter table public.repeater_tasks enable row level security;

-- Public events
create policy "public can read public events"
on public.events for select
using (visibility = 'public');

-- Users can read their own profile
create policy "users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- NOTE:
-- Officer/admin policies should be added only after defining trusted helper
-- functions for role checks. Do not rely on browser-side role checks for security.
