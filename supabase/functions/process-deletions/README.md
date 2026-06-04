# process-deletions

Daily job that performs account data erasure for `deletion_requests` whose
7-day grace period has elapsed.

## Deploy
```bash
supabase functions deploy process-deletions --no-verify-jwt
supabase secrets set CRON_SECRET="<a-long-random-string>"
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Scheduling
Invoked by `.github/workflows/process-deletions.yml` (daily 03:00 UTC). Add two
GitHub Actions repo secrets:
- `CRON_SECRET` — same value as the function secret above.
- `SUPABASE_ANON_KEY` — already used by the keepalive workflow.

You may instead schedule it with Supabase `pg_cron` if you prefer DB-native cron.

## What it does (per due request)
- **Delete:** `user_access`, `contact_messages`, and the `auth.users` login.
- **Anonymize (kept for accounting/legal):** `purchases`, `download_log`,
  `policy_acceptances` — PII stripped (`user_id` nulled, email redacted).
- **Audit:** appends a one-way email hash + timestamps to `deletion_log`.

## Safety
- Protected by a shared `x-cron-secret` header — returns 401 otherwise.
- Idempotent: only acts on `status='pending'` rows past `scheduled_for`.
- Verify the column assumptions (noted inline in `index.ts`) against your schema
  before enabling the daily schedule.
