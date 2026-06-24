-- Account data-deletion (GDPR-style "right to erasure") with a 7-day grace period.
--
-- Apply via: `supabase db push`  (or paste into the Supabase SQL editor).
-- Review before applying. service_role bypasses RLS by design, so the
-- process-deletions edge function keeps working.
--
-- Flow: the user requests deletion on the website (after re-entering their
-- password). A row is inserted here with scheduled_for = now() + 7 days. A daily
-- job (process-deletions edge function) performs the deletion once due. The user
-- can cancel any time before then by logging back in.

create table if not exists public.deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  user_email    text not null,
  requested_at  timestamptz not null default now(),
  scheduled_for timestamptz not null,
  status        text not null default 'pending' check (status in ('pending', 'canceled', 'completed')),
  canceled_at   timestamptz,
  completed_at  timestamptz
);

create index if not exists idx_deletion_requests_due
  on public.deletion_requests (status, scheduled_for);

-- At most one pending request per user.
create unique index if not exists uq_deletion_requests_pending
  on public.deletion_requests (user_id) where status = 'pending';

alter table public.deletion_requests enable row level security;

-- Users may read, create, and cancel ONLY their own request.
drop policy if exists "deletion_requests own select" on public.deletion_requests;
create policy "deletion_requests own select"
  on public.deletion_requests for select using (auth.uid() = user_id);

drop policy if exists "deletion_requests own insert" on public.deletion_requests;
create policy "deletion_requests own insert"
  on public.deletion_requests for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "deletion_requests own update" on public.deletion_requests;
create policy "deletion_requests own update"
  on public.deletion_requests for update
  -- Users may only act on their own *pending* request (i.e. cancel it). They may
  -- never write status='completed' or revive a finished/canceled request — only
  -- the service_role (process-deletions, which bypasses RLS) does that.
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status in ('pending', 'canceled'));

-- Immutable audit log of completed erasures. No FK to auth.users (must survive
-- the user's deletion); stores a one-way hash of the email, never the raw value.
create table if not exists public.deletion_log (
  id              uuid primary key default gen_random_uuid(),
  user_email_hash text,
  requested_at    timestamptz,
  completed_at    timestamptz not null default now()
);

alter table public.deletion_log enable row level security;
-- No policies => only service_role (the edge function) can read/write this log.
