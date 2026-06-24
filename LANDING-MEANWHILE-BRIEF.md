# Clinic Flow — "Meanwhile" Landing Page · Design Brief

> **For:** Open Design (full visual design + layout).
> **What this is:** A single, standalone **"coming soon / meanwhile" landing page** shown while the desktop app is still in development. Its job is to introduce Clinic Flow, build trust, and **capture early-access emails**. It is a *hidden* page (lives at `/soon`, not linked anywhere, `noindex`).
> **Hard rule:** **NO PRICES.** No pricing tables, no numbers, no "from ₪X", no checkout, no plan comparison. Pricing is intentionally omitted at this stage.
> **Language & direction:** **Hebrew, RTL.** All copy below is final-ish Hebrew you can use directly.

---

## 1. Product in one line

**Clinic Flow** is an **offline-first, privacy-first clinic-management desktop app** for independent health & therapy practitioners in Israel. The data lives on the practitioner's own computer, encrypted end-to-end — no cloud, no subscription dependency to keep working.

Tagline (already the brand line — use it as the hero headline):
> **פחות ניירת. יותר רפואה.** ("Less paperwork. More medicine.")

---

## 2. Goal of THIS page

1. **Primary:** Collect early-access emails (waitlist) — this is the one conversion action.
2. **Secondary:** Communicate the 3 differentiators (offline · privacy/security · full ownership) so the visitor *wants* to be notified.
3. **Tertiary:** Signal credibility & momentum ("real product, being built now, by people who care about your data").

Success = a visitor leaves their email. Design every section to funnel toward that.

---

## 3. Audience

Independent practitioners across many professions (the product is profession-agnostic). Use this real list for the rotating/animated profession line and for an optional "who it's for" section:

רופאים/ות פרטיים · פסיכולוגים/ות · פיזיותרפיסטים/ות · מרפאים/ות בעיסוק · פסיכותרפיסטים/ות · קלינאי/ות תקשורת · דיאטנים/ות · מטפלים/ות ברגש · רופאי/ות משפחה · אורתופדים/ות · וטרינרים/ות

Mindset: time-poor, privacy-conscious, not very "techy," wary of cloud systems and monthly fees, often working solo or in a small clinic. Tone must feel **calm, professional, trustworthy — not startup-hypey.**

---

## 4. Brand system (use exactly)

| Token | Value |
|-------|-------|
| Primary (deep blue) | `#0d47a1` |
| Secondary (teal) | `#00838f` |
| Ink / foreground | `#1a2332` |
| Muted text | `#5b6776` |
| Faint text | `#9aa6b2` |
| Accent surface (soft) | `#e8f4f8` |
| Border | `#e1e6ec` |
| Page background | white → `#f8fafb` → `#f0f4f7` (soft vertical gradient) |
| Brand gradient | `linear-gradient(90deg, #0d47a1 → #00838f)` — used on the wordmark and primary buttons |
| Font | **Heebo** (Google Fonts, weights 300–700) |
| Logo | "Clinic Flow" wordmark in the brand gradient; favicon is `favicon.svg`. (No standalone logomark yet — a simple medical/heartbeat mark is welcome if you propose one.) |

**Visual mood:** clean, medical, airy, lots of whitespace, soft blurred color glows (blue + teal radial blobs at low opacity), subtle shadows, rounded corners (cards ~16–24px radius, pills fully round). Think "premium calm clinical software," not consumer SaaS neon. Light theme only for this page.

---

## 5. Voice & copy guidelines

- Hebrew, RTL, warm-but-professional. Short sentences. Speak to "you" (אתם/ן, gender-inclusive where natural).
- Lead with **benefit**, not feature. ("הנתונים נשארים אצלכם" > "מסד נתונים מקומי").
- No jargon, no hype words ("מהפכני", "הטוב בעולם"). Confidence through clarity.
- Avoid anything that implies the app is already buyable/available. Frame as "בקרוב" / "בבנייה".

---

## 6. Page structure (top → bottom)

A single-scroll page. Sections in order:

### 6.1 Minimal header (sticky optional)
- Right (RTL start): **Clinic Flow** wordmark (gradient).
- Left (RTL end): a single quiet link `צרו קשר` → `mailto:info@clinic-flow.co.il`. No full nav.

### 6.2 Hero (the star — must contain the email capture)
- Small status **badge**: pill with a pulsing teal dot + text **"בבנייה — בקרוב"**.
- **Headline (H1):** `פחות ניירת. יותר רפואה.`
- Optional animated sub-line cycling the **professions** (e.g. "לרופאים פרטיים" → "לפסיכולוגיות" → …) in the brand gradient — this already exists on the live site (a "gooey"/morphing text effect); reuse the vibe if you like.
- **Subheadline:** `תוכנת ניהול קליניקה לאנשי ונשות מקצוע עצמאיים — עובדת אופליין, הנתונים נשארים אצלכם ומוצפנים מקצה לקצה. אנחנו בונים אותה עכשיו.`
- **Email capture (primary CTA):**
  - Single email input, placeholder `המייל שלכם`.
  - Button (gradient): `עדכנו אותי בהשקה`.
  - Microcopy under it: `בלי ספאם. רק עדכון אחד — כשנשיק.`
- Trust strip (3 inline items w/ small icons): `עובד לגמרי אופליין` · `הצפנה מקצה לקצה` · `הנתונים נשארים אצלכם`.

### 6.3 What is Clinic Flow (short context, 1 paragraph + optional app teaser)
- Heading: `מה זה Clinic Flow?`
- Copy: `מערכת אחת לניהול מטופלים, ביקורים, תורים, מסמכים וחוות דעת — שיושבת על המחשב שלכם, לא בענן. בלי תלות באינטרנט, בלי שהמידע הרגיש של המטופלים שלכם עובר דרך שרת של מישהו אחר.`
- Optional: a **blurred / teaser screenshot** of the app dashboard (RTL Hebrew UI) with a "תצוגה מקדימה" tag — conveys "real product" without over-promising. Keep it partial/cropped.

### 6.4 Three pillars (the differentiators) — 3 cards
1. **אופליין מלא** — icon: WiFi-off. `עובדת בלי חיבור לאינטרנט. הקליניקה לא נעצרת כשהרשת נופלת.`
2. **פרטיות ואבטחה** — icon: shield. `הצפנה מקצה לקצה (AES-256). המידע נשאר אצלכם, בהתאם לתיקון 13 לחוק הגנת הפרטיות.`
3. **בעלות מלאה** — icon: lock/key. `התוכנה שלכם — לא שכירות חודשית שתלויה בספק. (ללא מחירים בעמוד זה.)`

> Note for designer: pillar #3 communicates the *ownership/no-subscription* idea **without any price**. Do not add numbers.

### 6.5 Who it's for (optional)
- Heading: `נבנית עבורכם` + a soft grid/cloud of the profession names from §3.

### 6.6 Early-access repeat CTA (band)
- A full-width soft-gradient band restating the value + the **same email capture** (second chance to convert for scrollers).
- Heading: `רוצים להיות מהראשונים?` · Sub: `השאירו מייל ונעדכן אתכם ברגע שנשיק.`

### 6.7 Footer (minimal)
- Wordmark, `info@clinic-flow.co.il`, copyright `© <year> Clinic Flow`.
- Tiny legal links are OK if desired: `תנאי שימוש` · `פרטיות` (route to existing `/terms`, `/privacy`). No pricing link.

---

## 7. The email form — design all 4 states

(The team thinks in explicit UI states — please design each.)
- **Idle:** input + gradient button, calm.
- **Loading:** button shows an inline spinner + `רק רגע…`, disabled.
- **Success:** input/button replaced by a soft accent-surface confirmation chip: `תודה! נעדכן אתכם ברגע שנשיק.`
- **Error / invalid:** inline red helper under the field, e.g. `כתובת אימייל לא תקינה` / `משהו השתבש — נסו שוב`. Never lose what the user typed.

---

## 8. Motion / interaction

- Gentle entrance: fade + rise (8–20px) on hero and sections as they enter view (the site uses `motion/react`).
- Pulsing dot on the "בבנייה" badge; soft floating/parallax on the background glows.
- Button hover: slight opacity/scale. Keep it subtle and premium.
- **Respect `prefers-reduced-motion`** — disable non-essential animation.

---

## 9. Responsive

- **Mobile-first**, RTL. Hero email field stacks (input above button) on small screens; inline (button beside input, on the inline-start) on ≥sm.
- Comfortable tap targets (≥44px). Generous vertical rhythm. Pillars: 1 col (mobile) → 3 col (desktop).

---

## 10. Accessibility

- WCAG AA contrast (mind teal `#00838f` on white for small text — bump weight/size if needed).
- Visible focus rings (brand blue), full keyboard operability, labelled email input, `aria-live` on the form success/error message.
- Real semantic landmarks (`header`, `main`, `section`, `footer`), one `h1`.

---

## 11. SEO / meta (while hidden)

- `robots: noindex, nofollow` (already set in code on this route). Keep it.
- Title (for when/if made public): `Clinic Flow — תוכנת ניהול קליניקה אופליין · בקרוב`.
- Have an OG image concept ready (brand gradient + wordmark + "בקרוב") for when shared as a link — reuse `public/og-image` style.

---

## 12. Technical constraints (so the design drops straight in)

- Stack: **React 18 + Tailwind CSS 4 + `motion/react` + `lucide-react` icons + Heebo**. Build with Vite. RTL (`dir="rtl"`).
- It must live as **one standalone route, `/soon`**, rendered **outside** the main site `Layout` (no shared nav/footer) — already scaffolded.
- Reuse existing brand tokens/components where possible (the repo has `Hero`, `SecuritySection`, `OfflineBenefits`, `FeaturesSection`, `CTASection`, `Footer` for reference styling).
- Deliver as Tailwind-class-based components (no heavy CSS frameworks beyond what's listed).

---

## 13. Explicit exclusions (do NOT include)

- ❌ Any prices, plans, "from ₪…", discounts, or a pricing section.
- ❌ Checkout / payment / login / signup / dashboard links.
- ❌ Full site navigation menu.
- ❌ Fake testimonials or invented logos/customer counts.
- ❌ Claims that the app is available **now** (it's "בקרוב").

---

## 14. Deliverables expected from Open Design

1. **Desktop** (≈1440px) and **Mobile** (≈390px) layouts, **light theme, RTL**.
2. All hero + form **states** (idle/loading/success/error).
3. Component breakdown (header, hero+form, pillars, who-it's-for, repeat-CTA band, footer).
4. The OG/share image concept (§11).
5. Specs: spacing scale, type scale (Heebo weights), exact colors from §4, radii, shadows.

---

### Appendix — copy block (ready to paste)

- Badge: `בבנייה — בקרוב`
- H1: `פחות ניירת. יותר רפואה.`
- Sub: `תוכנת ניהול קליניקה לאנשי ונשות מקצוע עצמאיים — עובדת אופליין, הנתונים נשארים אצלכם ומוצפנים מקצה לקצה. אנחנו בונים אותה עכשיו.`
- Email placeholder: `המייל שלכם` · Button: `עדכנו אותי בהשקה` · Microcopy: `בלי ספאם. רק עדכון אחד — כשנשיק.`
- Trust strip: `עובד לגמרי אופליין` · `הצפנה מקצה לקצה` · `הנתונים נשארים אצלכם`
- Pillars: `אופליין מלא` / `פרטיות ואבטחה` / `בעלות מלאה` (copy in §6.4)
- Repeat CTA: `רוצים להיות מהראשונים?` · `השאירו מייל ונעדכן אתכם ברגע שנשיק.`
- Success: `תודה! נעדכן אתכם ברגע שנשיק.`
- Contact: `info@clinic-flow.co.il`
