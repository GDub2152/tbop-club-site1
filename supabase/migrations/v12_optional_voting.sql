-- TBOP V12: Optional Voting / Elections module
-- Run after V11 migration.

create table if not exists public.feature_flags (
  feature_key text primary key,
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.feature_flags(feature_key,enabled,configuration)
values (
  'voting',
  false,
  jsonb_build_object(
    'mode','internal',
    'member_label','Voting',
    'show_results_after_close',true
  )
)
on conflict (feature_key) do nothing;

alter table public.feature_flags enable row level security;

create or replace function public.can_manage_system_settings()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role in (
      'president'::public.club_role,
      'admin'::public.club_role
    )
    from public.profiles
    where id = auth.uid()),
    false
  );
$$;

grant execute on function public.can_manage_system_settings() to authenticated;

drop policy if exists "authenticated can read feature flags" on public.feature_flags;
drop policy if exists "system admins can manage feature flags" on public.feature_flags;

create policy "authenticated can read feature flags"
on public.feature_flags for select
to authenticated
using (true);

create policy "system admins can manage feature flags"
on public.feature_flags
for all
to authenticated
using (public.can_manage_system_settings())
with check (public.can_manage_system_settings());

-- Expand election schema for production controls.
alter table public.elections
  add column if not exists election_type text not null default 'officer'
    check (election_type in ('officer','motion','poll')),
  add column if not exists description text,
  add column if not exists eligible_count integer,
  add column if not exists opened_by uuid references auth.users(id),
  add column if not exists closed_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now();

alter table public.election_positions
  add column if not exists sort_order integer not null default 0,
  add column if not exists allow_write_in boolean not null default true;

alter table public.candidates
  add column if not exists sort_order integer not null default 0;

alter table public.elections enable row level security;
alter table public.election_positions enable row level security;
alter table public.candidates enable row level security;
alter table public.voter_receipts enable row level security;
alter table public.ballots enable row level security;

create or replace function public.can_manage_voting()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role in (
      'president'::public.club_role,
      'secretary'::public.club_role,
      'admin'::public.club_role
    )
    from public.profiles
    where id = auth.uid()),
    false
  );
$$;

grant execute on function public.can_manage_voting() to authenticated;

create or replace function public.voting_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select enabled from public.feature_flags where feature_key='voting'),
    false
  );
$$;

grant execute on function public.voting_enabled() to authenticated;

-- Election manager policies.
drop policy if exists "voting managers read elections" on public.elections;
drop policy if exists "voting managers manage elections" on public.elections;
drop policy if exists "members read open elections" on public.elections;

create policy "voting managers read elections"
on public.elections for select
to authenticated
using (public.can_manage_voting());

create policy "voting managers manage elections"
on public.elections
for all
to authenticated
using (public.can_manage_voting())
with check (public.can_manage_voting());

create policy "members read open elections"
on public.elections for select
to authenticated
using (
  public.voting_enabled()
  and status = 'open'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.membership_status='active'
      and p.voting_eligible=true
  )
);

drop policy if exists "voting managers manage positions" on public.election_positions;
drop policy if exists "members read positions" on public.election_positions;

create policy "voting managers manage positions"
on public.election_positions
for all
to authenticated
using (public.can_manage_voting())
with check (public.can_manage_voting());

create policy "members read positions"
on public.election_positions for select
to authenticated
using (
  public.voting_enabled()
  and exists (
    select 1 from public.elections e
    where e.id=election_id and e.status='open'
  )
);

drop policy if exists "voting managers manage candidates" on public.candidates;
drop policy if exists "members read candidates" on public.candidates;

create policy "voting managers manage candidates"
on public.candidates
for all
to authenticated
using (public.can_manage_voting())
with check (public.can_manage_voting());

create policy "members read candidates"
on public.candidates for select
to authenticated
using (
  public.voting_enabled()
  and exists (
    select 1
    from public.election_positions ep
    join public.elections e on e.id=ep.election_id
    where ep.id=position_id and e.status='open'
  )
);

-- Members may read only their own receipt; managers may read turnout receipts.
drop policy if exists "members read own voter receipt" on public.voter_receipts;
drop policy if exists "voting managers read voter receipts" on public.voter_receipts;

create policy "members read own voter receipt"
on public.voter_receipts for select
to authenticated
using (voter_id = auth.uid());

create policy "voting managers read voter receipts"
on public.voter_receipts for select
to authenticated
using (public.can_manage_voting());

-- No direct ballot SELECT policy for ordinary users/managers.
-- Votes should be submitted through the secure RPC below.

create or replace function public.cast_ballot(
  p_election uuid,
  p_choices jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt_exists boolean;
  choice jsonb;
  ballot_group uuid := gen_random_uuid();
  candidate_uuid uuid;
  position_uuid uuid;
  write_in_value text;
begin
  if not public.voting_enabled() then
    raise exception 'Voting is disabled';
  end if;

  if not exists (
    select 1 from public.profiles
    where id=auth.uid()
      and membership_status='active'
      and voting_eligible=true
  ) then
    raise exception 'Member is not eligible to vote';
  end if;

  if not exists (
    select 1 from public.elections
    where id=p_election
      and status='open'
      and (opens_at is null or opens_at <= now())
      and (closes_at is null or closes_at >= now())
  ) then
    raise exception 'Election is not open';
  end if;

  select exists(
    select 1 from public.voter_receipts
    where election_id=p_election and voter_id=auth.uid()
  ) into receipt_exists;

  if receipt_exists then
    raise exception 'Member has already voted';
  end if;

  for choice in select * from jsonb_array_elements(p_choices)
  loop
    position_uuid := nullif(choice->>'position_id','')::uuid;
    candidate_uuid := nullif(choice->>'candidate_id','')::uuid;
    write_in_value := nullif(trim(choice->>'write_in_text'),'');

    if position_uuid is null then
      raise exception 'Missing position';
    end if;

    if not exists (
      select 1
      from public.election_positions ep
      where ep.id=position_uuid and ep.election_id=p_election
    ) then
      raise exception 'Invalid election position';
    end if;

    if candidate_uuid is not null and not exists (
      select 1 from public.candidates c
      where c.id=candidate_uuid and c.position_id=position_uuid
    ) then
      raise exception 'Invalid candidate';
    end if;

    insert into public.ballots(
      election_id,position_id,candidate_id,write_in_text
    )
    values(
      p_election,position_uuid,candidate_uuid,write_in_value
    );
  end loop;

  insert into public.voter_receipts(election_id,voter_id,voted_at)
  values(p_election,auth.uid(),now());

  return ballot_group;
end;
$$;

grant execute on function public.cast_ballot(uuid,jsonb) to authenticated;

-- Election result RPC: only voting managers, and hidden while open unless live.
create or replace function public.get_election_results(p_election uuid)
returns table (
  position_id uuid,
  office_name text,
  candidate_name text,
  write_in_text text,
  vote_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_visibility text;
begin
  if not public.can_manage_voting() then
    raise exception 'Not authorized';
  end if;

  select status,results_visibility
  into v_status,v_visibility
  from public.elections
  where id=p_election;

  if v_status='open' and v_visibility <> 'live' then
    raise exception 'Results are hidden until voting closes';
  end if;

  return query
  select
    ep.id,
    ep.office_name,
    c.candidate_name,
    b.write_in_text,
    count(*)::bigint
  from public.ballots b
  join public.election_positions ep on ep.id=b.position_id
  left join public.candidates c on c.id=b.candidate_id
  where b.election_id=p_election
  group by ep.id,ep.office_name,c.candidate_name,b.write_in_text
  order by ep.sort_order, vote_count desc;
end;
$$;

grant execute on function public.get_election_results(uuid) to authenticated;

create index if not exists elections_status_idx on public.elections(status);
create index if not exists election_positions_election_idx on public.election_positions(election_id,sort_order);
create index if not exists candidates_position_idx on public.candidates(position_id,sort_order);
create index if not exists voter_receipts_election_idx on public.voter_receipts(election_id);
create index if not exists ballots_election_idx on public.ballots(election_id);
