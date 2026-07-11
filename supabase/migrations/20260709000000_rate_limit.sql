-- SECURITY: server-side login/signup throttling (UERR-028 / WEB-007).
-- The client's rate-limit.ts calls this RPC before every auth attempt. Until
-- this migration is applied, serverRateLimit() fails OPEN (allowed) and only
-- the per-tab in-memory fallback is active. Once applied, throttling becomes
-- authoritative across tabs/devices because the counter lives in Postgres.
--
-- Signature + return shape must match src-2/lib/rate-limit.ts exactly:
--   check_rate_limit(p_identifier text, p_max_attempts int, p_window_seconds int)
--   -> row { allowed boolean, remaining int, retry_after_seconds int }
--
-- SECURITY DEFINER + GRANT to anon so the un-authenticated login/signup pages
-- can call it. The table has RLS on with NO anon policies, so the anon role can
-- never read/write it directly — only through this function. Idempotent.

create table if not exists public.auth_rate_limits (
  identifier   text primary key,
  window_start timestamptz not null default now(),
  count        integer     not null default 0
);

-- Audit table is service-role-only; the anon role reaches the counter solely
-- via the SECURITY DEFINER function below.
alter table public.auth_rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_identifier   text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count        integer;
  v_window_start timestamptz;
  v_now          timestamptz := now();
begin
  -- Atomic upsert: start a fresh window on first hit, otherwise increment.
  insert into public.auth_rate_limits as t (identifier, window_start, count)
    values (p_identifier, v_now, 1)
  on conflict (identifier) do update
    set
      -- expired window → reset; still inside window → +1
      count = case
                when v_now - t.window_start > make_interval(secs => p_window_seconds)
                then 1
                else t.count + 1
              end,
      window_start = case
                when v_now - t.window_start > make_interval(secs => p_window_seconds)
                then v_now
                else t.window_start
              end
  returning t.count, t.window_start into v_count, v_window_start;

  allowed := v_count <= p_max_attempts;
  remaining := greatest(0, p_max_attempts - v_count);
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      0,
      p_window_seconds - floor(extract(epoch from (v_now - v_window_start)))::integer
    )
  end;
  return next;
end;
$$;

-- Un-authenticated auth pages need to call this; authed users too.
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;
