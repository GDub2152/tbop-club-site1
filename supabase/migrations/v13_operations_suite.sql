-- TBOP V13: Repeater, News, Equipment, Membership Cards, Approvals, Notifications, Analytics support
-- Run after V12 migration.

create table if not exists public.repeater_assets (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null,
  name text not null,
  manufacturer text,
  model text,
  serial_number text,
  location text,
  purchase_date date,
  warranty_expires date,
  status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repeater_maintenance (
  id uuid primary key default gen_random_uuid(),
  maintenance_date date not null default current_date,
  title text not null,
  category text,
  performed_by text,
  notes text,
  swr numeric(6,2),
  forward_power numeric(10,2),
  reflected_power numeric(10,2),
  firmware_version text,
  asset_id uuid references public.repeater_assets(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  summary text,
  body text not null,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  publish_at timestamptz,
  pinned boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public','members','officers')),
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  manufacturer text,
  model text,
  serial_number text,
  asset_tag text,
  condition text,
  location text,
  purchase_date date,
  purchase_price numeric(12,2),
  status text not null default 'available' check (status in ('available','checked_out','maintenance','retired')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_checkouts (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment_inventory(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete set null,
  checked_out_at timestamptz not null default now(),
  due_at timestamptz,
  returned_at timestamptz,
  notes text,
  created_by uuid references auth.users(id)
);

create table if not exists public.membership_cards (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  card_number text unique not null,
  issued_on date not null default current_date,
  expires_on date,
  qr_token uuid not null default gen_random_uuid(),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'members' check (audience in ('members','officers','role')),
  role_target public.club_role,
  status text not null default 'draft' check (status in ('draft','scheduled','sent','cancelled')),
  send_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.document_approvals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  approval_type text not null default 'document',
  title text not null,
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected','published')),
  requested_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  requested_at timestamptz,
  decided_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.can_manage_repeater()
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select role in (
    'repeater_trustee'::public.club_role,
    'president'::public.club_role,
    'admin'::public.club_role
  ) from public.profiles where id=auth.uid()),false);
$$;

create or replace function public.can_manage_content()
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select role in (
    'president'::public.club_role,
    'vice_president'::public.club_role,
    'secretary'::public.club_role,
    'admin'::public.club_role
  ) from public.profiles where id=auth.uid()),false);
$$;

create or replace function public.can_manage_equipment()
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select role in (
    'president'::public.club_role,
    'vice_president'::public.club_role,
    'repeater_trustee'::public.club_role,
    'admin'::public.club_role
  ) from public.profiles where id=auth.uid()),false);
$$;

grant execute on function public.can_manage_repeater() to authenticated;
grant execute on function public.can_manage_content() to authenticated;
grant execute on function public.can_manage_equipment() to authenticated;

alter table public.repeater_assets enable row level security;
alter table public.repeater_maintenance enable row level security;
alter table public.news_posts enable row level security;
alter table public.equipment_inventory enable row level security;
alter table public.equipment_checkouts enable row level security;
alter table public.membership_cards enable row level security;
alter table public.notifications enable row level security;
alter table public.document_approvals enable row level security;

drop policy if exists "repeater managers manage assets" on public.repeater_assets;
create policy "repeater managers manage assets" on public.repeater_assets
for all to authenticated using (public.can_manage_repeater()) with check (public.can_manage_repeater());

drop policy if exists "repeater managers manage maintenance" on public.repeater_maintenance;
create policy "repeater managers manage maintenance" on public.repeater_maintenance
for all to authenticated using (public.can_manage_repeater()) with check (public.can_manage_repeater());

drop policy if exists "public read published news" on public.news_posts;
create policy "public read published news" on public.news_posts
for select to anon,authenticated using (
  status='published' and visibility='public' and (publish_at is null or publish_at <= now())
);

drop policy if exists "content managers manage news" on public.news_posts;
create policy "content managers manage news" on public.news_posts
for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "equipment managers manage inventory" on public.equipment_inventory;
create policy "equipment managers manage inventory" on public.equipment_inventory
for all to authenticated using (public.can_manage_equipment()) with check (public.can_manage_equipment());

drop policy if exists "equipment managers manage checkouts" on public.equipment_checkouts;
create policy "equipment managers manage checkouts" on public.equipment_checkouts
for all to authenticated using (public.can_manage_equipment()) with check (public.can_manage_equipment());

drop policy if exists "members read own card" on public.membership_cards;
create policy "members read own card" on public.membership_cards
for select to authenticated using (profile_id=auth.uid());

drop policy if exists "admins manage cards" on public.membership_cards;
create policy "admins manage cards" on public.membership_cards
for all to authenticated using (public.is_club_admin()) with check (public.is_club_admin());

drop policy if exists "content managers manage notifications" on public.notifications;
create policy "content managers manage notifications" on public.notifications
for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "content managers manage approvals" on public.document_approvals;
create policy "content managers manage approvals" on public.document_approvals
for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content());

create index if not exists repeater_assets_type_idx on public.repeater_assets(asset_type);
create index if not exists repeater_maintenance_date_idx on public.repeater_maintenance(maintenance_date);
create index if not exists news_posts_status_publish_idx on public.news_posts(status,publish_at);
create index if not exists equipment_inventory_status_idx on public.equipment_inventory(status);
create index if not exists equipment_checkouts_equipment_idx on public.equipment_checkouts(equipment_id);
create index if not exists notifications_status_idx on public.notifications(status,send_at);
