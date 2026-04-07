-- Run this in the Supabase SQL editor
-- Creates the policy_acceptances table for logging when users accept terms before payment

CREATE TABLE IF NOT EXISTS policy_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  plan TEXT NOT NULL,
  policy_version TEXT NOT NULL DEFAULT '2026-04-07',
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user_id ON policy_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_accepted_at ON policy_acceptances(accepted_at);

-- RLS: users can insert their own acceptance; only service role can read all
ALTER TABLE policy_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own acceptance"
  ON policy_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins/service role can SELECT all rows (for your Supabase dashboard)
-- No SELECT policy needed for anon/users — they don't need to read logs
