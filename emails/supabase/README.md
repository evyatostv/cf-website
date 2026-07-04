# Supabase Auth email templates (Group A)

These five HTML files are the **standalone, self-contained** versions of the ClinicFlow
Group-A auth emails, formatted for **Supabase Auth (GoTrue)**. Unlike the Group B–E
templates, these are **NOT** rendered/sent by our edge functions — GoTrue sends them
directly over SMTP. So they must be plain HTML with GoTrue's `{{ .Variable }}`
placeholders, inline CSS only, no JS, no external stylesheet.

Source of truth for copy + design: [`../DESIGN-SOURCE.html`](../DESIGN-SOURCE.html)
(mirrored at the repo-root `email-previews.html`). Templates #1–5 there are authoritative.

All files are Hebrew, `dir="rtl" lang="he"`, 600px max width, table/section based,
Heebo web-font with **Arial fallback**, and use the hosted PNG logo
`https://clinic-flow.co.il/logo/cf-lockup-horizontal.png` (with `alt`) — never inline SVG.

---

## 1. File → Supabase template-slot map

Supabase Dashboard → **Authentication → Email Templates** exposes exactly four slots.
Map the files as follows:

| File | Supabase slot ("Email Templates" tab) | Placeholders used | Notes |
|------|----------------------------------------|-------------------|-------|
| `confirm-email.html`  | **Confirm signup**          | `{{ .ConfirmationURL }}` | Sent on sign-up to verify the address. |
| `magic-link.html`     | **Magic Link**              | `{{ .Token }}` + `{{ .ConfirmationURL }}` | Shows the 6-digit OTP **and** a one-click login button. |
| `reset-password.html` | **Reset Password** (a.k.a. "Reset Password for User" / recovery) | `{{ .ConfirmationURL }}` | Copy is intentionally generic — it does **not** confirm whether an account exists. |
| `change-email.html`   | **Change Email Address**    | `{{ .ConfirmationURL }}` + `{{ .NewEmail }}` | `{{ .NewEmail }}` renders the address the user is switching to. |
| `welcome.html`        | **(none — not a GoTrue slot)** | *no auth variable* | See §5. GoTrue has no "welcome" template; this is **app-triggered** after email confirmation. |

### Placeholder reference (GoTrue)
- `{{ .ConfirmationURL }}` — the full action link (verify / recover / change-email / magic-link login). Already URL-safe; drop it straight into `href`.
- `{{ .Token }}` — the 6-digit OTP for magic-link / OTP sign-in.
- `{{ .NewEmail }}` — the new address in a change-email flow.
- Other available vars (not needed here): `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`, `{{ .Email }}`.

---

## 2. Install — Option A: Dashboard (paste HTML)

For each of the four GoTrue templates:

1. Supabase Dashboard → **Authentication → Email Templates**.
2. Select the tab (Confirm signup / Magic Link / Change Email Address / Reset Password).
3. Set the **Subject** (Hebrew, from DESIGN-SOURCE / the table below).
4. Open the matching `emails/supabase/*.html`, copy its **entire** contents, and paste
   into the template body (switch the editor to the raw/"Source" HTML view first).
5. Save. Repeat for all four. Do **not** paste `welcome.html` here.

Hebrew subjects (verbatim from DESIGN-SOURCE):

| Slot | Subject (he) |
|------|--------------|
| Confirm signup | `אימות כתובת האימייל שלך ב-ClinicFlow` |
| Magic Link | `קוד הכניסה שלך ל-ClinicFlow` |
| Reset Password | `איפוס הסיסמה שלך ב-ClinicFlow` |
| Change Email Address | `אישור שינוי כתובת האימייל` |
| *(welcome — app-sent)* | `ברוכים הבאים ל-ClinicFlow` |

---

## 3. Install — Option B: `config.toml` with `content_path`

For local dev / CI-reproducible config, wire the HTML files via the Supabase CLI's
`[auth.email.template.*]` blocks. Paths are **relative to `supabase/config.toml`**, so
if `config.toml` lives at `supabase/config.toml` and these files stay under
`emails/supabase/`, the relative path is `../emails/supabase/<file>.html`.

```toml
[auth.email.template.confirmation]
subject = "אימות כתובת האימייל שלך ב-ClinicFlow"
content_path = "../emails/supabase/confirm-email.html"

[auth.email.template.magic_link]
subject = "קוד הכניסה שלך ל-ClinicFlow"
content_path = "../emails/supabase/magic-link.html"

[auth.email.template.recovery]
subject = "איפוס הסיסמה שלך ב-ClinicFlow"
content_path = "../emails/supabase/reset-password.html"

[auth.email.template.email_change]
subject = "אישור שינוי כתובת האימייל"
content_path = "../emails/supabase/change-email.html"
```

Notes:
- The template keys are GoTrue's canonical names: `confirmation`, `magic_link`,
  `recovery`, `email_change` (also `invite`, `reauthentication` — unused here).
- There is deliberately **no** `welcome` block — GoTrue has no such template (see §5).
- After editing `config.toml`, apply with `supabase db push` / `supabase start`
  (local) or by pushing config to a linked project. Dashboard edits and `config.toml`
  can diverge — pick one source of truth per environment.

> This snippet is provided for reference; wiring it into an actual `supabase/config.toml`
> is out of scope for these files and left to the infra owner.

---

## 4. Point Auth SMTP at Resend

GoTrue must send through Resend's SMTP (so these emails go out from
`info@clinic-flow.co.il`, not Supabase's shared sender).

**Dashboard:** Authentication → **SMTP Settings** → *Enable Custom SMTP*:

| Field | Value |
|-------|-------|
| Sender email | `info@clinic-flow.co.il` |
| Sender name | `ClinicFlow` |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) — `587` (STARTTLS) also works |
| Username | `resend` |
| Password | your Resend API key (`re_...`, same value as `RESEND_API_KEY`) |

**`config.toml` equivalent:**

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "info@clinic-flow.co.il"
sender_name = "ClinicFlow"
```

**Deliverability prerequisite:** the sending domain must be verified in Resend
(SPF `include:_spf.resend.com`, DKIM CNAMEs, DMARC). See the DNS section in
[`../README.md`](../README.md) §5. Until then, Resend only sends from its sandbox
sender and custom-domain mail will be rejected.

---

## 5. `welcome.html` is app-triggered, NOT a GoTrue template

GoTrue has **no native "welcome" email**. `welcome.html` is a post-signup greeting that
must be sent by **our own code after email confirmation**, e.g.:

- a Supabase **Auth Hook** (`Send Email` / `after user confirmed` hook) that calls an edge
  function, **or**
- an edge function invoked from the confirm-callback flow.

Because it's app-sent (through the same Resend pipeline as Groups B–E), the canonical
authored version is the React-Email template `emails/welcome.tsx` rendered via
`_shared/render.ts` + `_shared/send-email.ts`. The `welcome.html` here is the
self-contained mirror kept in sync with DESIGN-SOURCE #5 for reference / a
non-edge fallback. Do **not** paste it into a Dashboard slot — there isn't one.

Send subject: `ברוכים הבאים ל-ClinicFlow`.

---

## 6. Verification checklist (state of these five files)

| File | Placeholders present | Self-contained (inline CSS, no JS/ext CSS) | RTL / `lang="he"` | Logo PNG + alt | Preheader | Status |
|------|----------------------|:--:|:--:|:--:|:--:|:--:|
| `confirm-email.html`  | `{{ .ConfirmationURL }}` (button + link fallback) | ✔ | ✔ | ✔ | ✔ | PASS |
| `magic-link.html`     | `{{ .Token }}` + `{{ .ConfirmationURL }}` | ✔ | ✔ | ✔ | ✔ | PASS |
| `reset-password.html` | `{{ .ConfirmationURL }}` (button + link fallback); generic non-enumerating copy | ✔ | ✔ | ✔ | ✔ | PASS |
| `change-email.html`   | `{{ .ConfirmationURL }}` + `{{ .NewEmail }}` | ✔ | ✔ | ✔ | ✔ | PASS |
| `welcome.html`        | *none (app-triggered)* | ✔ | ✔ | ✔ | ✔ | PASS |
