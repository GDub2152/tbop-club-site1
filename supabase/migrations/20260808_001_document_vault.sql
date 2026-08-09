-- =====================================================================
-- TBOP CMS 1.0 LTS - Secure Document Vault Beta 1
-- Migration: 20260808_001_document_vault.sql
--
-- Purpose
--   Private Supabase Storage bucket + document metadata + versioning
--   + recycle bin + audit trail + role-aware Row Level Security.
--
-- IMPORTANT
--   Run only after the core `public.profiles` table and `public.club_role`
--   enum exist.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Central executive-role helper
-- President, Vice President, Secretary, Treasurer, Sergeant at Arms,
-- and technical Admin have full operational Vault access.
-- ---------------------------------------------------------------------
create or replace function public.tbop_is_executive()
returns boolean
language sql
stable
security definer
set search_path = ''
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

create or replace function public.tbop_current_role()
returns public.club_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

grant execute on function public.tbop_is_executive() to authenticated;
grant execute on function public.tbop_current_role() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Vault zone authorization helpers
-- Zones are encoded as the first object-path segment.
-- ---------------------------------------------------------------------
create or replace function public.tbop_can_read_vault_zone(zone text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.club_role;
begin
  r := public.tbop_current_role();

  if r is null then
    return false;
  end if;

  if public.tbop_is_executive() then
    return zone in ('members','officers','financial','repeater','archive');
  end if;

  if r = 'repeater_trustee'::public.club_role then
    return zone in ('members','repeater');
  end if;

  if r = 'trustee'::public.club_role then
    return zone in ('members','archive');
  end if;

  return zone = 'members';
end;
$$;

create or replace function public.tbop_can_write_vault_zone(zone text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.club_role;
begin
  r := public.tbop_current_role();

  if r is null then
    return false;
  end if;

  if public.tbop_is_executive() then
    return zone in ('members','officers','financial','repeater','archive');
  end if;

  if r = 'repeater_trustee'::public.club_role then
    return zone = 'repeater';
  end if;

  return false;
end;
$$;

create or replace function public.tbop_can_permanently_delete_vault()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin'::public.club_role
     from public.profiles p
     where p.id = auth.uid()),
    false
  );
$$;

grant execute on function public.tbop_can_read_vault_zone(text) to authenticated;
grant execute on function public.tbop_can_write_vault_zone(text) to authenticated;
grant execute on function public.tbop_can_permanently_delete_vault() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Metadata tables
-- ---------------------------------------------------------------------
create table if not exists public.vault_folders (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.vault_folders(id) on delete restrict,
  name text not null,
  security_zone text not null
    check (security_zone in ('members','officers','financial','repeater','archive')),
  description text,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

create table if not exists public.vault_documents (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.vault_folders(id) on delete restrict,
  title text not null,
  description text,
  security_zone text not null
    check (security_zone in ('members','officers','financial','repeater','archive')),
  tags text[] not null default '{}',
  current_version integer not null default 0 check (current_version >= 0),
  approval_status text not null default 'draft'
    check (approval_status in ('draft','pending','approved','rejected','published','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

create table if not exists public.vault_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.vault_documents(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  storage_path text not null unique,
  original_filename text not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  sha256 text,
  version_note text,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table if not exists public.vault_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  document_id uuid references public.vault_documents(id) on delete set null,
  version_id uuid references public.vault_document_versions(id) on delete set null,
  folder_id uuid references public.vault_folders(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.vault_folders enable row level security;
alter table public.vault_documents enable row level security;
alter table public.vault_document_versions enable row level security;
alter table public.vault_audit_log enable row level security;

-- ---------------------------------------------------------------------
-- 4. Metadata RLS
-- ---------------------------------------------------------------------
drop policy if exists "vault folders readable by zone" on public.vault_folders;
drop policy if exists "vault folders writable by zone" on public.vault_folders;
drop policy if exists "vault documents readable by zone" on public.vault_documents;
drop policy if exists "vault documents writable by zone" on public.vault_documents;
drop policy if exists "vault versions readable through document" on public.vault_document_versions;
drop policy if exists "vault versions writable through document" on public.vault_document_versions;
drop policy if exists "vault audit visible to executives" on public.vault_audit_log;
drop policy if exists "vault audit insert authenticated" on public.vault_audit_log;

create policy "vault folders readable by zone"
on public.vault_folders
for select to authenticated
using (
  deleted_at is null
  and public.tbop_can_read_vault_zone(security_zone)
);

create policy "vault folders writable by zone"
on public.vault_folders
for all to authenticated
using (public.tbop_can_write_vault_zone(security_zone))
with check (public.tbop_can_write_vault_zone(security_zone));

create policy "vault documents readable by zone"
on public.vault_documents
for select to authenticated
using (
  deleted_at is null
  and public.tbop_can_read_vault_zone(security_zone)
);

create policy "vault documents writable by zone"
on public.vault_documents
for all to authenticated
using (public.tbop_can_write_vault_zone(security_zone))
with check (public.tbop_can_write_vault_zone(security_zone));

create policy "vault versions readable through document"
on public.vault_document_versions
for select to authenticated
using (
  exists (
    select 1
    from public.vault_documents d
    where d.id = document_id
      and d.deleted_at is null
      and public.tbop_can_read_vault_zone(d.security_zone)
  )
);

create policy "vault versions writable through document"
on public.vault_document_versions
for all to authenticated
using (
  exists (
    select 1
    from public.vault_documents d
    where d.id = document_id
      and public.tbop_can_write_vault_zone(d.security_zone)
  )
)
with check (
  exists (
    select 1
    from public.vault_documents d
    where d.id = document_id
      and public.tbop_can_write_vault_zone(d.security_zone)
  )
);

create policy "vault audit visible to executives"
on public.vault_audit_log
for select to authenticated
using (public.tbop_is_executive());

create policy "vault audit insert authenticated"
on public.vault_audit_log
for insert to authenticated
with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. Audit RPC. Clients call this instead of writing arbitrary actor IDs.
-- ---------------------------------------------------------------------
create or replace function public.tbop_vault_audit(
  p_action text,
  p_document uuid default null,
  p_version uuid default null,
  p_folder uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.vault_audit_log(
    actor_id, action, document_id, version_id, folder_id, metadata
  )
  values(
    auth.uid(), p_action, p_document, p_version, p_folder, coalesce(p_metadata,'{}'::jsonb)
  );
end;
$$;

grant execute on function public.tbop_vault_audit(text,uuid,uuid,uuid,jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Recycle-bin RPCs
-- Executives and zone writers can trash/restore. Permanent deletion remains
-- technical Admin only and is intentionally NOT exposed as a client RPC here.
-- ---------------------------------------------------------------------
create or replace function public.tbop_vault_trash_document(p_document uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  z text;
begin
  select security_zone into z
  from public.vault_documents
  where id = p_document;

  if z is null or not public.tbop_can_write_vault_zone(z) then
    raise exception 'Not authorized';
  end if;

  update public.vault_documents
  set deleted_at = now(), deleted_by = auth.uid(), updated_at = now()
  where id = p_document;

  perform public.tbop_vault_audit(
    'document_trashed', p_document, null, null, '{}'::jsonb
  );
end;
$$;

create or replace function public.tbop_vault_restore_document(p_document uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  z text;
begin
  select security_zone into z
  from public.vault_documents
  where id = p_document;

  if z is null or not public.tbop_can_write_vault_zone(z) then
    raise exception 'Not authorized';
  end if;

  update public.vault_documents
  set deleted_at = null, deleted_by = null, updated_at = now()
  where id = p_document;

  perform public.tbop_vault_audit(
    'document_restored', p_document, null, null, '{}'::jsonb
  );
end;
$$;

grant execute on function public.tbop_vault_trash_document(uuid) to authenticated;
grant execute on function public.tbop_vault_restore_document(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Private Storage bucket
-- Supabase Storage encryption-at-rest is handled by the platform. The bucket
-- is deliberately private and browser access is always authorized by RLS.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('club-vault', 'club-vault', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

-- Storage path convention:
-- <zone>/<folder-id>/<document-id>/v0001/<safe-filename>
--
-- The first path segment is the authorization boundary.

drop policy if exists "vault storage read by zone" on storage.objects;
drop policy if exists "vault storage insert by zone" on storage.objects;
drop policy if exists "vault storage update by zone" on storage.objects;
drop policy if exists "vault storage delete admin only" on storage.objects;

create policy "vault storage read by zone"
on storage.objects
for select to authenticated
using (
  bucket_id = 'club-vault'
  and public.tbop_can_read_vault_zone((storage.foldername(name))[1])
);

create policy "vault storage insert by zone"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'club-vault'
  and public.tbop_can_write_vault_zone((storage.foldername(name))[1])
);

create policy "vault storage update by zone"
on storage.objects
for update to authenticated
using (
  bucket_id = 'club-vault'
  and public.tbop_can_write_vault_zone((storage.foldername(name))[1])
)
with check (
  bucket_id = 'club-vault'
  and public.tbop_can_write_vault_zone((storage.foldername(name))[1])
);

-- Physical object deletion is intentionally restricted to technical Admin.
-- Normal users "delete" by moving metadata into the recycle bin.
create policy "vault storage delete admin only"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'club-vault'
  and public.tbop_can_permanently_delete_vault()
);

-- ---------------------------------------------------------------------
-- 8. Seed top-level folders, if not already present
-- ---------------------------------------------------------------------
insert into public.vault_folders(name,security_zone,description,sort_order)
select x.name,x.zone,x.description,x.sort_order
from (values
  ('Member Documents','members','Documents available to authenticated club members.',10),
  ('Officer Records','officers','Administrative and governance records.',20),
  ('Financial Records','financial','Treasurer and financial records.',30),
  ('Repeater Technical','repeater','Repeater programming, service, site and technical records.',40),
  ('Archive','archive','Long-term historical club records.',50)
) as x(name,zone,description,sort_order)
where not exists (
  select 1 from public.vault_folders f
  where f.parent_id is null and f.name=x.name and f.security_zone=x.zone
);

-- ---------------------------------------------------------------------
-- 9. Indexes
-- ---------------------------------------------------------------------
create index if not exists vault_folders_parent_idx
  on public.vault_folders(parent_id,sort_order,name);

create index if not exists vault_documents_folder_idx
  on public.vault_documents(folder_id,updated_at desc);

create index if not exists vault_documents_zone_idx
  on public.vault_documents(security_zone);

create index if not exists vault_documents_deleted_idx
  on public.vault_documents(deleted_at);

create index if not exists vault_versions_document_idx
  on public.vault_document_versions(document_id,version_number desc);

create index if not exists vault_audit_document_idx
  on public.vault_audit_log(document_id,occurred_at desc);

commit;
