# Clerk features → Supabase parity (for ClinicFlow)

Goal: match the Clerk feature set on the free Supabase-native auth. But ClinicFlow is a
**solo/small-clinic, offline-first, pay-once** product with **no roles by design** — so a
chunk of Clerk (orgs, enterprise SSO, RBAC, impersonation) is deliberately out of scope.
Legend: ✅ done · ⚙️ Supabase native, just a dashboard toggle · 🔨 worth building (code) · ⛔ skip for ClinicFlow.

## ✅ Already built
- Email + password sign-in / sign-up
- Google social sign-in (both website and app share the Supabase project)
- **Account linking** — same verified email → one account (Supabase automatic)
- Password reset + update pages
- User profiles + metadata (`profiles` table + `raw_user_meta_data`)
- Post-signup onboarding (name/phone/profession) — `CompleteProfilePage`
- Self-service account deletion w/ 7-day grace + re-auth (password OR Google re-login)
- **MFA / 2FA (TOTP)** — `TwoFactorSection` (enroll/disable) + `MfaGate` (enforces the code at login)

## ⚙️ Supabase-native — flip a dashboard toggle (no code; user must do)
| Clerk feature | Supabase location |
|---|---|
| **Email verification** (anti-duplicate/takeover) | Auth → Providers → Email → **Confirm email** |
| **Breached/leaked password protection** (HaveIBeenPwned) | Auth → Passwords → leaked password protection |
| **Password strength rules** | Auth → Passwords → minimum length / requirements |
| **Bot protection / CAPTCHA** (hCaptcha / Turnstile) | Auth → Attack Protection |
| **Rate limiting** | Built-in (Auth rate limits, configurable) |
| **Session lifetime / JWT expiry** | Auth → Sessions |
| **Magic link / email OTP** (passwordless) | Native — enable + small UI |

## 🔨 Worth building (I can code these)
| Clerk feature | Supabase mechanism | Value for ClinicFlow |
|---|---|---|
| **MFA / 2FA** (TOTP authenticator app + enrollment/challenge UI) | `supabase.auth.mfa.*` | **High** — medical-adjacent data, security-conscious buyers |
| **Sign out other devices** | `signOut({ scope: 'others' })` | Medium |
| **Resend verification email** UI | `supabase.auth.resend` | Medium |
| **Connected accounts** view (show email/Google, unlink) | `user.identities` + `unlinkIdentity` | Low–medium |
| **Magic-link login** option | `signInWithOtp` | Low–medium (nice-to-have) |

## ⛔ Skip for ClinicFlow (not applicable / over-engineering)
- **Organizations / teams / invitations / B2B** — single clinician, offline; no multi-tenant need
- **Roles & permissions (RBAC)** — intentionally not built (see offline/no-roles decision)
- **Enterprise SSO / SAML** — no enterprise buyers
- **Passkeys / WebAuthn** — limited Supabase support, low ROI now
- **Web3 wallet login** — irrelevant
- **Impersonation / admin login-as**, **ban/lock users** — admin tooling, later if ever
- **Phone/SMS OTP** — needs a paid SMS provider (Twilio); cost + Israeli deliverability, skip
- **Prebuilt UI components** — already have custom Hebrew/RTL UI
- **Webhooks for user events** — have edge functions; add per-need

## Recommended build order
1. Flip the ⚙️ toggles (email confirm, leaked-password, CAPTCHA) — biggest security win, zero code.
2. **MFA / 2FA (TOTP)** — the one real feature worth coding.
3. Connected-accounts view + resend-verification + sign-out-other-devices — small polish.
4. Everything in ⛔ stays out unless the product pivots to multi-user/enterprise.
