-- Welcome-email dedupe marker.
--
-- Apply via: `supabase db push`  (or paste into the Supabase SQL editor).
--
-- GoTrue has no "welcome" email slot, so the welcome mail is app-triggered via
-- the send-welcome edge function after the user's first confirmed login. To send
-- it EXACTLY ONCE per user, that function stamps this column and skips if it's
-- already set. service_role (the edge function) bypasses RLS, so no policy is
-- needed for the write.

alter table public.user_access
  add column if not exists welcome_sent_at timestamptz;
