# Auth Architecture — Clerk + Supabase (DECISION RECORD)

**Status:** Decided 2026-07-03. **Do not re-open** without a concrete new constraint.
**Direction:** Path 1 — Clerk is the single identity provider; Supabase validates Clerk tokens.

## The one-sentence version

There is **one** identity directory (Clerk). Both the website and the desktop app
authenticate against Clerk (Google included). Supabase never authenticates anyone —
it only *validates* Clerk's session token and stores data. One Google account works
everywhere; the user feels no seam because there is no seam.

## Why this shape

- **Seamless UX / trust:** "Log in with Google" everywhere, one account.
- **Sustainable:** no credential sync, no two-directory reconciliation to babysit.
- **Offline promise intact:** only *identity* touches the cloud. Patient/clinical data
  stays local + encrypted on the desktop app. Licensing/login was already online.
- **Secret-key safe:** the desktop app uses only Clerk's **publishable key** (client-safe).
  The Clerk **secret key is never bundled** in `app.asar`. Supabase does token validation.

## How it works

```
            ┌─────────── Clerk (single source of truth) ───────────┐
            │  users, Google OAuth, sessions                        │
            └───────────────────────┬──────────────────────────────┘
                                    │ session token (has "role":"authenticated" + sub)
        ┌───────────────────────────┼───────────────────────────┐
        ▼                                                       ▼
  cf-website (Vite)                                     ClinicFlow (Electron)
  Clerk web SDK → getToken()                            Clerk publishable key
        │                                               OAuth 2.0 + PKCE in system
        │                                               browser, deep-link callback
        ▼                                                       ▼
        └──────────────► Supabase (data store) ◄────────────────┘
              accessToken = Clerk token; RLS uses auth.jwt()->>'sub'
```

## Supabase configuration (one-time, in dashboards)

1. Clerk dashboard → enable the **Supabase integration** (adds `"role":"authenticated"` claim).
2. Supabase dashboard → Authentication → add **Clerk** as a third-party auth provider (by Clerk domain).
3. RLS policies read the Clerk user id via `auth.jwt()->>'sub'`.
4. **No JWT-secret sharing** with Clerk (the deprecated JWT-template approach is not used).
5. The integration does **NOT** sync user rows. If Supabase needs a `profiles` row for
   foreign keys, mirror it with a **one-way** Clerk→Supabase webhook (`user.created` /
   `user.updated`). This is data mirroring, never auth.

## Rollout

- **Phase A — NOW (this repo, isolated):** Clerk on `cf-website` via `clerk init --app app_3FzUVKtqTkTJiadPTc96xhgIQeE`.
  Add sign-in/up + user button. `clerk doctor`, smoke test. Zero risk to the desktop app.
- **Phase B — LATER (ClinicFlow, deliberate):**
  1. Import existing Supabase-password users into Clerk (Clerk user-import). Cheap while beta (v0.9.x).
  2. Build the Electron sign-in: publishable key + OAuth PKCE, system browser, deep-link/loopback callback,
     secure token storage. Replaces `supabase.auth.signInWithPassword` in `src/main/supabase.js`.
  3. Repoint Supabase RLS + plan-enforcement to the Clerk `sub` (see plan-enforcement notes).
  4. Keep clinical data 100% local — only the token round-trips.

## Clerk app

`app_3FzUVKtqTkTJiadPTc96xhgIQeE` — pass to every `clerk init`.

## Anti-goals (things we explicitly rejected)

- ❌ Two auth systems with email-based sync between Clerk and Supabase (Path 2) — permanent
  maintenance burden, verification/reset divergence, "same Google → two identities" edge cases.
- ❌ Shipping the Clerk secret key in the desktop bundle.
- ❌ Sending any patient/clinical data to Clerk or through the cloud.
