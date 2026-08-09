-- =====================================================================
-- TBOP CMS 1.0 LTS - Secure Document Vault Beta 2
-- Migration: 20260808_002_document_vault_ui.sql
-- Requires Beta 1 migration.
-- =====================================================================

begin;

alter table public.vault_documents
  add column if not exists classification text not null default 'members'
    check (classification in ('members','executive','financial','technical','confidential'));

alter table public.vault_documents
  add column if not exists confidential_roles public.club_role[] not null default '{}';

create or replace function public.tbop_can_read_document(
  p_zone text,
  p_classification text,
  p_confidential_roles public.club_role[]
)
returns boolean
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  r public.club_role;
begin
  r := public.tbop_current_role();
  if r is null then return false; end if;

  if public.tbop_is_executive() then return true; end if;

  if p_classification = 'members' then
    return public.tbop_can_read_vault_zone(p_zone);
  end if;

  if p_classification = 'technical' then
    return r = 'repeater_trustee'::public.club_role;
  end if;

  if p_classification = 'financial' then
    return false;
  end if;

  if p_classification = 'executive' then
    return false;
  end if;

  if p_classification = 'confidential' then
    return r = any(coalesce(p_confidential_roles,'{}'::public.club_role[]));
  end if;

  return false;
end;
$$;

grant execute on function public.tbop_can_read_document(text,text,public.club_role[]) to authenticated;

drop policy if exists "vault documents readable by zone" on public.vault_documents;
create policy "vault documents readable by zone"
on public.vault_documents
for select to authenticated
using (
  deleted_at is null
  and public.tbop_can_read_document(security_zone,classification,confidential_roles)
);

drop policy if exists "vault versions readable through document" on public.vault_document_versions;
create policy "vault versions readable through document"
on public.vault_document_versions
for select to authenticated
using (
  exists (
    select 1
    from public.vault_documents d
    where d.id=document_id
      and d.deleted_at is null
      and public.tbop_can_read_document(d.security_zone,d.classification,d.confidential_roles)
  )
);

-- Recycle bin listing for executives and zone writers.
create or replace function public.tbop_vault_list_trash()
returns table (
  id uuid,
  folder_id uuid,
  title text,
  description text,
  security_zone text,
  classification text,
  current_version integer,
  deleted_at timestamptz,
  deleted_by uuid
)
language sql
stable
security definer
set search_path=''
as $$
  select d.id,d.folder_id,d.title,d.description,d.security_zone,d.classification,
         d.current_version,d.deleted_at,d.deleted_by
  from public.vault_documents d
  where d.deleted_at is not null
    and public.tbop_can_write_vault_zone(d.security_zone)
  order by d.deleted_at desc;
$$;

grant execute on function public.tbop_vault_list_trash() to authenticated;

create or replace function public.tbop_vault_list_audit(p_document uuid default null)
returns table (
  id bigint,
  actor_id uuid,
  action text,
  document_id uuid,
  version_id uuid,
  folder_id uuid,
  metadata jsonb,
  occurred_at timestamptz
)
language sql
stable
security definer
set search_path=''
as $$
  select a.id,a.actor_id,a.action,a.document_id,a.version_id,a.folder_id,a.metadata,a.occurred_at
  from public.vault_audit_log a
  where public.tbop_is_executive()
    and (p_document is null or a.document_id=p_document)
  order by a.occurred_at desc
  limit 500;
$$;

grant execute on function public.tbop_vault_list_audit(uuid) to authenticated;

-- Search helper limited by the caller's document access.
create or replace function public.tbop_vault_search(p_query text)
returns table (
  id uuid,
  folder_id uuid,
  title text,
  description text,
  security_zone text,
  classification text,
  tags text[],
  current_version integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path=''
as $$
  select d.id,d.folder_id,d.title,d.description,d.security_zone,d.classification,
         d.tags,d.current_version,d.updated_at
  from public.vault_documents d
  where d.deleted_at is null
    and public.tbop_can_read_document(d.security_zone,d.classification,d.confidential_roles)
    and (
      d.title ilike '%' || coalesce(p_query,'') || '%'
      or coalesce(d.description,'') ilike '%' || coalesce(p_query,'') || '%'
      or array_to_string(d.tags,' ') ilike '%' || coalesce(p_query,'') || '%'
    )
  order by d.updated_at desc
  limit 200;
$$;

grant execute on function public.tbop_vault_search(text) to authenticated;

commit;
