# Clerk Migration + Payment Plan (cf-website)

Executable companion to `AUTH-ARCHITECTURE.md` (the decision record). Status: **PLAN — not yet executed.**
Decided direction: **Clerk = single identity provider; Supabase = data store that trusts Clerk tokens; Israeli PSP (AllPay) = payments + invoicing. Clerk never touches money.**

---

## 0. Two things that are settled — don't re-litigate

- **Payments do NOT go through Clerk.** Clerk Billing is subscription-only, USD-only, needs a Stripe merchant account (Stripe doesn't onboard Israel-based sellers), and issues no Israeli חשבונית מס. ClinicFlow is pay-once in ₪ with a legal invoice requirement → **keep AllPay**. Clerk is identity only.
- **The website already has real Supabase auth wired into the payment flow** (`lib/auth-context.tsx` consumed by 9 files, incl. PaymentPage/PricingPage/ThankYouPage). "Adding Clerk" = **migrating** that, not a fresh install.

---

## 1. Current state (from audit)

**Auth:** `lib/auth-context.tsx` = Supabase email/password + session. Consumed by: App, Navigation, LoginPage, SignupPage, DashboardPage, PaymentPage, PricingPage, ThankYouPage, DeleteAccountSection.

**Payments (AllPay — correct, currently broken):**
- Plans: Basic ₪899, Professional ₪999, Full ₪1,299 (duplicated in ~5 files — see §5).
- Flow: PricingPage → `/payment?plan=` → PaymentPage calls `create-allpay-payment` edge fn → redirect to AllPay → AllPay POSTs `allpay-webhook` → `grantAccess()` upserts `user_access(user_id, plan, is_active, license_key)` + inserts `purchases` → license `CF-<PLAN>-XXXX-…` → Resend emails → ThankYouPage polls `user_access.is_active`.
- **Identity coupling:** Supabase `user.id` → AllPay `add_field_1` → `user_access.user_id` (PK). Desktop app logs in (Supabase) and reads `user_access` to activate. **This is the join the auth migration must repoint to the Clerk `sub`.**
- Stripe edge functions exist but are **unused/legacy**.

---

## 2. FIX PAYMENTS FIRST (independent of Clerk, revenue-critical)

The breakage is almost certainly configuration, not code. Do this before/parallel to the auth work — it doesn't depend on Clerk. Requires dashboard/secret access (human).

1. **Supabase function secrets:** confirm `ALLPAY_LOGIN`, `ALLPAY_KEY` are set and are the **live** credentials that match the AllPay dashboard (a wrong key silently fails signature/status checks). Also `RESEND_API_KEY`.
2. **AllPay dashboard:** confirm the webhook/callback URL points to `https://<supabase-project>/functions/v1/allpay-webhook`.
3. **Resend:** confirm domain `clinic-flow.co.il` is verified (else license emails fail silently; `notify-contact` still uses the `onboarding@resend.dev` sandbox sender).
4. **DB:** confirm `user_access` and `purchases` tables exist with expected columns.
5. **Logs:** `supabase functions logs create-allpay-payment` and `… allpay-webhook`; do one real ₪-test purchase end-to-end.

## 3. Payment correctness/security backlog (after it's un-broken)

- **Validate the AllPay webhook signature** on the incoming request (today it only re-queries AllPay's status API; if `ALLPAY_KEY` is wrong, validation is effectively bypassed). Webhook is `verify_jwt=false` → unauthenticated.
- **Cross-check `amount` vs `plan`** in the webhook before `grantAccess()` (today a mismatched amount/plan is trusted → under-pay for a higher tier).
- **Single source of truth for prices** (currently duplicated across PaymentPage, create-allpay-payment, create-payment-intent, allpay-webhook, payment-context). Watch agorot↔ILS conversions in the upgrade-credit math.
- **Add a "resend license" path** + make email failures non-silent (customer can be marked active but never receive the key).
- **AllPay refunds** aren't wired (no refund webhook) → refunded users stay `is_active` (TODO in `allpay-webhook`). Define a manual/admin path.
- **Email verification before checkout** (a typo'd email becomes the license destination).
- Delete dead `payment-context.tsx` (defined, never used) to prevent price drift.

---

## 4. Auth migration — Supabase → Clerk (library mode)

This is a **Vite SPA using react-router in library mode** (`createBrowserRouter` + `<RouterProvider>` in `src-2/app/`). Do NOT use framework-mode APIs (`rootAuthLoader`, `clerkMiddleware`, `getAuth` in loaders) — there is no server.

**Phase 0 — dashboards (no code):**
- Clerk: enable the **Supabase integration** (adds `"role":"authenticated"` claim) and the **Google** social connection.
- Supabase: add **Clerk** as a third-party auth provider (by Clerk domain). RLS reads `auth.jwt()->>'sub'`.
- **Migrate existing users** into Clerk (Clerk user import). Cheap now (beta, few/test users). Keep an email→(old Supabase uid, new Clerk sub) map for §6.

**Phase 1 — wire the provider (library mode):**
- Wrap the app with `<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>` from `@clerk/react-router` in **library mode**, around `<RouterProvider>` in `src-2/app/App.tsx` (keep it *inside* nothing that needs the old AuthProvider). Follow the `clerk-react-router-patterns` skill / library-mode quickstart for exact props.
- **Low-churn strategy — keep the `useAuth()` shape.** Rewrite `lib/auth-context.tsx` as a thin adapter backed by Clerk (`useUser`, `useClerk`, `useAuth`) that still returns `{ user, session, loading, signIn, signUp, signOut }`. This means the 9 consumers barely change. `signIn/signUp` route to Clerk; `signOut` → `clerk.signOut()`.
- **Data access:** build the Supabase client to inject the Clerk token via the `accessToken` option (third-party auth) so `user_access`/`purchases`/`leads` reads keep working under RLS keyed to the Clerk `sub`.

**Phase 2 — auth UI:**
- `LoginPage` / `SignupPage`: replace the Supabase forms with Clerk `<SignIn/>` / `<SignUp/>` (Google appears automatically once enabled), or keep custom UI via Clerk hooks. `ResetPasswordPage` → Clerk's flow (retire the Supabase reset).
- `Navigation`: `<SignedOut>` → sign-in/up buttons; `<SignedIn>` → `<UserButton/>`.
- Style to match: `@clerk/ui` shadcn theme is optional (no `components.json` here, so plain appearance props).

---

## 5. Repoint payment/license identity to Clerk (couples §2 and §4)

- `create-allpay-payment`: set `add_field_1` = **Clerk user id** (from the Clerk session token), not the Supabase uid.
- `allpay-webhook`: `user_access.user_id` becomes the Clerk `sub`. **Backfill existing rows** old-uid → clerk-sub using the email map from Phase 0.
- Desktop app (Phase B): after Clerk login, query `user_access` by Clerk `sub`.

---

## 6. Sequencing (avoids the two-directory split-brain)

1. **Fix payments** (§2) — independent, do now.
2. **Phase 0 dashboards + user import** (§4) — establishes Clerk as the one directory *before* any surface flips.
3. **Website auth migration** behind the `useAuth` shim (§4 Phase 1–2).
4. **Repoint user_access/purchases to Clerk sub** + backfill (§5).
5. **Desktop app → Clerk** (Phase B: OAuth PKCE deep-link, publishable key only, Supabase-trusts-Clerk). Only after the website is proven.

> Doing user-import + third-party-auth *before* flipping surfaces is what prevents a window where website=Clerk and app=Supabase are two separate accounts.

---

## 7. Open questions for the human (can't tell from code)

- Are `ALLPAY_LOGIN`/`ALLPAY_KEY`/`RESEND_API_KEY` set in Supabase secrets, and live vs test?
- Is the AllPay webhook URL registered and pointing at the right project?
- Has any real purchase ever completed end-to-end? Any rows in `user_access`/`purchases`?
- How many real (non-test) users exist today? (Determines user-import effort.)
