-- A payment-link token never leaves the server. Only its identity digest is retained.
alter table public.orders add column grow_link_digest text check (grow_link_digest ~ '^[0-9a-f]{64}$');
create unique index orders_grow_link_digest_unique on public.orders(grow_link_digest) where grow_link_digest is not null;
