# download-installer Edge Function

Issues a short-lived signed URL for the ClinicFlow installer after verifying the account’s active paid license and qualifying purchase.

## What it does

1. Verifies the Supabase JWT (anyone can call, but must be logged in).
2. Reads `user_access` for the user.
3. Rejects inactive, expired, trial, and unpaid accounts. A purchase lookup failure also prevents link issuance.
4. Generates a 5-minute signed URL to the installer in the private `installers` bucket.
5. Records link issuance in `download_log` and `audit_events`. These events measure issued links. Transfer completion and installation require separate evidence. A logging failure still allows the authorized download.
6. Returns `{ downloadUrl, expiresAt, plan }`.

## One-time setup

### 1. Create the private storage bucket

In the Supabase dashboard → Storage → New bucket:
- Name: `installers`
- Public: **OFF**

Upload the installer files at the root of the bucket:
- `ClinicFlow-Setup.exe`
- `ClinicFlow-Setup.dmg`
- `ClinicFlow-Setup.AppImage` (optional)

If you use different filenames, update `INSTALLER_PATHS` in `../_shared/installers.ts`.

### 2. Create the download_log table (optional but recommended)

```sql
create table public.download_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  plan text,
  os text,
  installer text,
  created_at timestamptz default now()
);

-- No public access — only the service role (used by this function) writes here.
alter table public.download_log enable row level security;
```

If you skip this table, the function still works — the insert just logs a warning.

### 3. Deploy the function

```bash
cd cf-website
supabase functions deploy download-installer
```

### 4. Environment variables

The function uses these (already set on Supabase by default):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `INSTALLERS_BUCKET` — override bucket name (default: `installers`)
- `SITE_URL` — extra allowed CORS origin

## Testing

```bash
# Get a JWT from a logged-in browser session (DevTools → Application → Local Storage → sb-...-auth-token)
curl -X POST https://dmuwxydmuylcbhcoagri.supabase.co/functions/v1/download-installer \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"os":"win"}'
```

Expected `200`:
```json
{ "downloadUrl": "https://...?token=...", "expiresAt": "...", "plan": "professional" }
```

Expected `403` if no license:
```json
{ "error": "No active license", "code": "NO_ACTIVE_LICENSE" }
```

## Design notes

- **Same installer for everyone.** Plan-specific feature gating happens inside the Electron app (already implemented in `src/main/index.js` + `src/renderer/app.js`). This endpoint just gates *access* to the binary.
- **5-minute expiry** is plenty for the browser to start the download. Old links die quickly so they can't be passed around.
- **Service role is only used inside the function** — never exposed to the client. The user's own JWT is what verifies their identity.

### Private Apple Silicon release asset

When the storage plan cannot hold the signed DMG, both checkout and download can use the same private GitHub release asset in `evyatostv/ClinicFlow`. Set `MAC_INSTALLER_GITHUB_ASSET_ID` and `MAC_INSTALLER_SHA256` to the verified stable DMG and keep `INSTALLER_GITHUB_READ_TOKEN` in server secrets. Scope this token to read repository contents for this repository only. Confirm it can read the selected asset. Never put a personal administrator token in this function.

The server checks repository privacy, the asset's SHA-256, stable Apple Silicon filename and byte count, then requests one byte through the temporary link. Download still requires the existing account, active plan and verified purchase. Checkout checks availability before opening an order. GitHub chooses the signed link expiry, which is returned in `expiresAt`. With both asset settings absent the existing private storage path is used. An incomplete or invalid selection blocks Mac checkout and download. Keep the payment callback verified before enabling the selection.
