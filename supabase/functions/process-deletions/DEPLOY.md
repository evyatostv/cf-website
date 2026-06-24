# process-deletions — Deploy & Runbook

Exact steps to take the GDPR account-deletion flow live for ClinicFlow.
Nothing here has been deployed automatically — run these manually once you have
the Supabase + GitHub credentials.

Project ref (from the existing endpoint URL): **`dmuwxydmuylcbhcoagri`**

---

## 1. Apply the database migration

Creates `public.deletion_requests` (with RLS) and `public.deletion_log`.

```bash
supabase link --project-ref dmuwxydmuylcbhcoagri   # once, if not already linked
supabase db push
```

Or paste `supabase/migrations/20260604000000_deletion_requests.sql` into the
Supabase SQL editor.

Verify after applying:
- `deletion_requests` has RLS **enabled** with 3 policies (own select / own
  insert / own update-while-pending).
- `deletion_log` has RLS enabled and **no** policies (service_role only).
- Unique partial index `uq_deletion_requests_pending` exists (one pending row
  per user).

---

## 2. Deploy the edge function

```bash
supabase functions deploy process-deletions --no-verify-jwt
```

`--no-verify-jwt` is required: the GitHub Action authenticates with the
`x-cron-secret` header, not an end-user JWT.

---

## 3. Set the edge-function secret

```bash
supabase secrets set CRON_SECRET="<a-long-random-string>"
```

Generate one with e.g. `openssl rand -hex 32`. Save it — you need the SAME
value as a GitHub secret in step 4.

| Function env var | Source |
|---|---|
| `CRON_SECRET` | set manually (above) — must match the GitHub secret |
| `SUPABASE_URL` | auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | auto-injected by Supabase (never hardcode it) |

The function refuses to run (401) unless `CRON_SECRET` is set AND the incoming
`x-cron-secret` header matches it.

---

## 4. Configure GitHub Actions repo secrets

The workflow `.github/workflows/process-deletions.yml` runs daily at 03:00 UTC
(and via manual `workflow_dispatch`). It needs two repo secrets
(Settings → Secrets and variables → Actions → New repository secret):

| GitHub secret | Value |
|---|---|
| `CRON_SECRET` | **exactly** the same string set in step 3 |
| `SUPABASE_ANON_KEY` | the project anon key (already used by the keepalive workflow) |

The anon key is only used as the `Authorization: Bearer` header so the Supabase
gateway accepts the request; the real authorization is `x-cron-secret`.

---

## 5. Smoke test (no real deletions)

```bash
# Should return 401 (no/incorrect secret):
curl -i -X POST \
  "https://dmuwxydmuylcbhcoagri.supabase.co/functions/v1/process-deletions" \
  -H "Authorization: Bearer <ANON_KEY>"

# Should return 200 {"ok":true,"processed":N,...} (N=0 if nothing is due):
curl -i -X POST \
  "https://dmuwxydmuylcbhcoagri.supabase.co/functions/v1/process-deletions" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "x-cron-secret: <CRON_SECRET>"
```

Then trigger the Action manually once (Actions tab → Process Account Deletions →
Run workflow) and confirm it prints `process-deletions: 200`.

---

## What the function does per due request

- **Delete:** `user_access`, `contact_messages` (by email), and the
  `auth.users` login (deleted LAST; on success the FK cascade removes the
  `deletion_requests` row).
- **Anonymize (kept for accounting/legal):** `purchases` (`user_id`→null,
  `email`→redacted), `download_log` (same), `policy_acceptances`
  (`user_email`→redacted).
- **Audit:** appends a one-way SHA-256 email hash + timestamps to `deletion_log`.

Idempotency: the request is only marked `completed` after the auth user is
deleted, so a mid-run failure leaves it `pending` and the next daily run retries.

---

## ⚠️ Verify against your live schema before enabling the schedule

The column assumptions were checked against the front-end / other edge functions
in this repo and currently match:

| Table | Columns the function touches | Confirmed in |
|---|---|---|
| `user_access` | `user_id` | `src-2/lib/supabase.ts` |
| `contact_messages` | `email` | `src-2/app/pages/ContactPage.tsx` |
| `purchases` | `user_id`, `email` | `src-2/lib/supabase.ts` |
| `download_log` | `user_id`, `email` | `supabase/functions/download-installer/index.ts` |
| `policy_acceptances` | `user_id`, `user_email` | `src-2/lib/supabase.ts` |

**Open item to confirm in the DB (not visible in this repo):** the foreign-key
behaviour of `policy_acceptances.user_id` → `auth.users(id)`. If that FK is
`ON DELETE RESTRICT`/`NO ACTION`, `deleteUser()` in step 4 will FAIL because the
anonymize step only redacts `user_email`, it does NOT null `user_id`. It must be
either `ON DELETE SET NULL`/`CASCADE`, or the anonymize step must also set
`user_id = null`. Check before enabling the daily cron.
