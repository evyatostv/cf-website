-- Grow/Make orders. Browser clients can create/read only their own pending orders;
-- payment state and licenses are service-role only.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  package_id text not null,
  amount integer not null check (amount > 0), -- agorot
  currency text not null default 'ILS' check (currency = 'ILS'),
  status text not null default 'PENDING' check (status in ('PENDING','PAID','FAILED','CANCELLED','REFUNDED','MANUAL_REVIEW')),
  payment_provider text not null default 'grow_make',
  external_transaction_id text,
  provider_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists orders_customer_created_idx on public.orders(customer_id, created_at desc);
create unique index if not exists orders_one_pending_package_idx on public.orders(customer_id, package_id) where status = 'PENDING';
create unique index if not exists orders_external_txn_unique on public.orders(external_transaction_id) where external_transaction_id is not null;
alter table public.orders enable row level security;
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders for select to authenticated using (auth.uid() = customer_id);

