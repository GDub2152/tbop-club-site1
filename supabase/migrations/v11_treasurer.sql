-- TBOP V11: Treasurer ledger, budgets, dues/payment records + RLS
-- Run after V10 migration.

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  transaction_type text not null check (transaction_type in ('income','expense')),
  category text not null,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  member_id uuid references public.profiles(id) on delete set null,
  payment_method text,
  reference_number text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  fiscal_year integer not null,
  category text not null,
  budget_type text not null default 'expense'
    check (budget_type in ('income','expense')),
  budget_amount numeric(12,2) not null check (budget_amount >= 0),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fiscal_year, category, budget_type)
);

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  paid_on date not null default current_date,
  amount numeric(12,2) not null check (amount >= 0),
  membership_year integer not null,
  payment_method text,
  reference_number text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.financial_transactions enable row level security;
alter table public.budget_items enable row level security;
alter table public.membership_payments enable row level security;

create or replace function public.can_manage_finances()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role in (
      'president'::public.club_role,
      'treasurer'::public.club_role,
      'admin'::public.club_role
    )
    from public.profiles
    where id = auth.uid()),
    false
  );
$$;

grant execute on function public.can_manage_finances() to authenticated;

drop policy if exists "finance roles manage transactions" on public.financial_transactions;
create policy "finance roles manage transactions"
on public.financial_transactions
for all
to authenticated
using (public.can_manage_finances())
with check (public.can_manage_finances());

drop policy if exists "finance roles manage budgets" on public.budget_items;
create policy "finance roles manage budgets"
on public.budget_items
for all
to authenticated
using (public.can_manage_finances())
with check (public.can_manage_finances());

drop policy if exists "finance roles manage membership payments" on public.membership_payments;
create policy "finance roles manage membership payments"
on public.membership_payments
for all
to authenticated
using (public.can_manage_finances())
with check (public.can_manage_finances());

create or replace function public.audit_financial_change(
  entity_kind text,
  entity_key uuid,
  action_name text,
  details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_finances() then
    raise exception 'not authorized';
  end if;

  insert into public.audit_log(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), action_name, entity_kind, entity_key::text, details);
end;
$$;

grant execute on function public.audit_financial_change(text,uuid,text,jsonb) to authenticated;

create index if not exists financial_transactions_date_idx
  on public.financial_transactions(transaction_date);

create index if not exists financial_transactions_type_idx
  on public.financial_transactions(transaction_type);

create index if not exists financial_transactions_category_idx
  on public.financial_transactions(category);

create index if not exists membership_payments_member_year_idx
  on public.membership_payments(member_id,membership_year);

create index if not exists budget_items_year_idx
  on public.budget_items(fiscal_year);
