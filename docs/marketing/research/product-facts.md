# ClinicFlow — Product Fact Sheet (Single Source of Truth)

**Purpose:** This is the canonical reference for every SEO/GEO content writer. Do not state any product claim that is not confirmed here. If a fact you need is missing, do not invent it — flag it. All prices, capabilities, and platform claims below were verified against the live source in `src-2/` on 2026-07-12 unless marked otherwise.

**Verified against:** `FeaturesPage.tsx`, `PricingPage.tsx`, `HomePage.tsx`, `AboutPage.tsx`, `FeaturesSection.tsx`, `SecuritySection.tsx`, `Hero.tsx`, `OfflineBenefits.tsx`, and the SEO/GEO strategy spec (`docs/superpowers/specs/2026-07-12-seo-geo-strategy-design.md`).

---

## ⚠️ UNRESOLVED DISCREPANCIES — read before writing any content

These are conflicts between the internal "ground truth" brief and what the live site code actually says. **Do not publish a claim on either side of these until the owner reconciles them.** Publishing SEO content that contradicts the live pricing/features page is self-harm.

1. **Basic-plan price (759 vs 899).** The strategy spec §2.3 and the GEO quotable claim (§4.2, "החל מ־₪759") use **₪759**. The live `PricingPage.tsx` renders the Basic plan (`חבילה בסיסית`) at **₪899**. These contradict each other.
   - **Rule until resolved:** the price that ships to users is **₪899** (live code). Do NOT write "₪759" anywhere. If you need an entry price, use "₪899" OR write "החל מתשלום חד־פעמי" with no number, and add a TODO for the owner to confirm which price is canonical (and update either the page or the spec).

2. **Platform: Windows-only vs Windows + macOS.** Internal ground truth says **Windows only**. The live `PricingPage.tsx` FAQ states: *"האפליקציה זמינה ל-Windows ול-macOS."* (available for Windows AND macOS).
   - **Rule until resolved:** do NOT assert "Windows only" and do NOT assert macOS support in new content. Write platform-neutral ("אפליקציית דסקטופ שמותקנת על המחשב") until the owner confirms. Flag for reconciliation.

3. **"Premium" plan naming.** Ground truth names four tiers: Basic / Professional / Full Management / **Premium (contact)**. In the live code, legacy `premium` is merged into `full` (`normalizePlan()` maps `premium → full`), and the fourth, contact-only tier is named **`פתרון ארגוני` (Enterprise)**, not "Premium." Use **`פתרון ארגוני`** as the current name of the contact-only tier.

---

## 1. What ClinicFlow is

**Canonical one-liner (use verbatim, everywhere — footer, GBP, directories, socials, schema `description`):**

> ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך, בתשלום חד־פעמי וללא מנוי. הנתונים נשארים אצלך, בהתאם לתיקון 13.

**What it is, factually:**
- A **desktop application** (Electron) that installs and runs **on the clinician's own computer**. Installation is stated on-site as taking **under a minute** (`PricingPage` FAQ: "ההתקנה לוקחת פחות מדקה").
- **Offline-first / works with no internet** for all clinical work: patient records, scheduling, documentation, and document editing all function fully with no connection (`SecuritySection`, `Hero`, `OfflineBenefits`, `FeaturesPage`).
- **All patient data lives only on the local device** — no server, no cloud, no external backup destination (`AboutPage`, `SecuritySection`, `FeaturesPage`: "אין שרת, אין ענן... הכל על הדיסק שלך").
- Sold as a **one-time lifetime purchase, no subscription** — "רישיון לצמיתות / לנצח," "תשלום חד-פעמי בלבד," "ללא עלויות חודשיות או שנתיות" (`PricingPage`).
- **Hebrew UI, RTL**, built for the Israeli private-practice market.
- Positioning frame: **Amendment 13 (תיקון 13)** — because data never leaves the device, the compliance/privacy posture is the wedge.
- **Stage:** beta, ~**0.9.x** (per project memory; **not** displayed on the public site — do not put a version number in customer content).

**One nuance content writers must respect (not a contradiction, a precision):**
The app is offline **for patient data**, but **license/plan activation uses a separate secure server** — `SecuritySection` states: *"ניהול הרישיון מתבצע דרך שרת מאובטח בנפרד לחלוטין."* So: never write "the app never connects to the internet at all." Correct framing: **patient data never leaves the device; only license/activation is validated against a separate server that never sees patient data.**

**Target audiences named on-site** (Hero rotating text — usable for per-profession landing pages): רופאים פרטיים, פסיכולוגים, פיזיותרפיסטים, מרפאים בעיסוק, פסיכותרפיסטים, קלינאי תקשורת, דיאטנים, מטפלים ברגש, רופאי משפחה, אורתופדים, וטרינרים (each with feminine form).

---

## 2. Verified feature list

### 2a. Canonical feature names (from `FeaturesPage.tsx`) — use these exact Hebrew strings

Each feature below is real and appears on the live Features page, with its plan gating. The plan tag tells you which package unlocks it (drives "available in advanced plans" language).

| # | Feature name (exact Hebrew) | Plan tier | What it does (verified) |
|---|---|---|---|
| 1 | **כרטיס מטופל מלא** | basic | Full patient card: allergies, ongoing treatment, previous-visit summary visible at a glance. |
| 2 | **יומן תורים** | basic | Appointment calendar — daily/weekly/monthly, drag-to-reschedule, reminders (see forbidden-claims note on reminders). |
| 3 | **תיעוד ביקורים** | basic | Visit documentation with structured **SOAP** fields and ready-made phrases; produces a PDF at end of visit. |
| 4 | **דוחות ומעקב** | professional | Reports/tracking: visits per month, documents, hours worked, shown as graphs. |
| 5 | **קבלות וחשבוניות** | full | Receipts & invoices issued from the screen; income tracking by month/year. |
| 6 | **חוות דעת מקצועיות** | full | Professional/medical opinions with templates per document type, section editing, signature, PDF export. |
| 7 | **ארכיון מסמכים** | basic | Document archive organized by patient and date; search by a word inside a document. |
| 8 | **גיבוי מוצפן** | basic | Encrypted backup, automatic, password-protected; restore onto a new machine in minutes. |
| 9 | **נעילה אוטומטית** | basic | Auto-lock / screen dim when away; PIN to unlock. |
| 10 | **נתונים אצלך בלבד** | basic | Data on your disk only — no server, no cloud, no external backup. |
| 11 | **פרטיות מוחלטת** | basic | ClinicFlow has no access to patient data — cannot see it even if it wanted to. |
| 12 | **עובד בלי אינטרנט** | basic | Full offline operation — visits, documents, calendar keep working. |

### 2b. Feature names as they appear on the **homepage** (`FeaturesSection.tsx`) — naming variants

The homepage uses slightly different labels for the same underlying capabilities. Both sets are "live." Prefer the `FeaturesPage` names (2a) as canonical; these are acceptable alternates:
- **ניהול מטופלים** — patient card with medical history, anamnesis, detailed documentation.
- **יומן תורים** — smart scheduling with reminders, daily/weekly view.
- **תיעוד רפואי** — medical records, diagnoses, test results, treatment follow-up.
- **חוות דעת רפואיות** — professional opinions incl. digital signature and PDF export.
- **חשבוניות וקבלות** — automatic invoices, receipts, full financial management.
- **דוחות וסטטיסטיקות** — advanced data analysis, detailed reports, graphs.
- **ארכיון מסודר** — organize and fast-search all medical info and documents.
- **גיבוי ושחזור** — backup of data on your computer to prevent loss.

### 2c. Security-page feature names (`SecuritySection.tsx`)
- **נתוני מטופלים — מקומי בלבד** (patient data local only)
- **עבודה ללא אינטרנט** (works with no internet)
- **אפס שיתוף נתוני מטופלים** (zero patient-data sharing; license handled by separate server)
- **שליטה מלאה בנתונים** (full data control — ClinicFlow does not see/collect/store patient data)

### 2d. Offline-benefit angles (`OfflineBenefits.tsx`) — usable talking points
נפתח מיד (opens instantly) · עבודה בכל מקום (works anywhere) · אין שרת שאפשר לפרוץ (no server to breach) · שליטה מלאה (full control).

### 2e. Plan-gating summary (what unlocks where)
- **Basic** includes: patient card, calendar, visit documentation (SOAP), document archive, encrypted backup, auto-lock, local-only data, privacy, offline.
- **Professional** adds: reports/tracking, graphs & data analysis, personal journal & record tagging, sticky notes on dashboard, advanced search & filter.
- **Full (ניהול מלאה)** adds: income/financial reports, receipts, invoices, combined receipt+invoice, payment-method/service-type tracking, professional medical opinions with signature.
- Content writers may say a feature is "זמין בחבילות מתקדמות" for anything not in Basic (matches the on-site lock badge).

---

## 3. Pricing & upgrade policy

**Pricing model:** one-time payment, lifetime license ("רישיון לצמיתות / לנצח"), no monthly or annual fees. Period label used on cards is "**/ לנצח**." Guarantee: **30-day full money-back** ("30 יום החזר כספי מלא," repeated on Pricing and About). Licensed per computer (per project ground truth; not restated on the pricing page — do not over-specify seat terms in content).

**Live plan table (from `PricingPage.tsx`):**

| Slug | Name (Hebrew) | Price (live code) | Positioning |
|---|---|---|---|
| basic | חבילה בסיסית | **₪899** ⚠️ (spec says ₪759 — see Discrepancy #1) | מטפלים יחידים שרוצים להתחיל |
| professional | חבילה מקצועית | **₪999** | קליניקות קטנות עם ארגון מתקדם — "הכי פופולרי" |
| full | חבילת ניהול מלאה | **₪1,299** | קליניקות בינוניות עם ניהול כספי |
| (enterprise) | פתרון ארגוני | **contact / צור קשר** (price null) | קליניקות גדולות, רשתות, התאמה אישית |

**Upgrade / credit policy (verbatim intent, from `PricingPage`):**
- "קניתם חבילה בסיסית ורוצים לשדרג? תשלמו רק את **ההפרש**. הסכום ששילמתם **נזקף לטובתכם**."
- Canonical phrasing for content: **upgrading credits the full amount already paid — you pay only the difference between packages.** Upgrades allowed at any time.

**Enterprise (`פתרון ארגוני`) — contact-only, custom.** Its listed items include **custom integrations, data export via API, mobile app, custom branding, priority support**. ⚠️ These are **bespoke, contact-only add-ons — NOT standard product features.** Several of them (API export, mobile app, custom integrations) sit in tension with the offline/no-cloud core. **Do not describe API export, mobile app, or integrations as ClinicFlow capabilities in general marketing or comparison pages.** They exist only as quote-based enterprise add-ons.

---

## 4. Security / privacy architecture

**On-site verifiable claims (safe to use):**
- All patient/medical records are stored **only on the local device**; no central server exists to breach (`AboutPage`, `OfflineBenefits`, `SecuritySection`).
- **ClinicFlow (the company) cannot see, collect, or store patient data** — stated repeatedly ("אין לנו גישה," "אנחנו פשוט לא יכולים לראות אותם").
- **Encrypted backup**, automatic, **password-protected** — restore onto a new machine in minutes ("גיבוי מוצפן... הצפנה עם סיסמה שרק את/ה יודע/ת").
- **Auto-lock + PIN** protect the screen against physical access.
- **License activation runs on a separate secure server** that handles only licensing — not patient data.

**Backend ground truth (true, but NOT currently stated on the public site — verify before publishing as an on-site claim):**
- Storage engine: **SQLite**, local file on the device.
- Encryption: **AES-256-GCM** local encryption.
- **Exported PDFs are encrypted.**
- Backups: encrypted, restorable.
- Platform: Electron desktop (see Discrepancy #2 on Windows vs macOS).

> Note for writers: the current site says "גיבוי מוצפן / הצפנה עם סיסמה" but does **not** name "AES-256-GCM" or "SQLite." You MAY state "הצפנה בתקן AES-256" and "מסד נתונים מקומי" because they are true per the app architecture, but they are new claims — mark them for owner sign-off before shipping, and keep them factual (local AES-256-GCM encryption; do not imply cloud KMS, HSM, or third-party audits that don't exist).

**Compliance framing (תיקון 13):** the accurate, defensible argument is: *because patient data never leaves the clinician's device and there is no cloud store, the data-exposure surface that Amendment 13 targets is materially reduced.* Do **not** claim ClinicFlow "makes you compliant" or "guarantees compliance" — see forbidden claims. Frame as architecture that supports privacy/compliance, not a legal guarantee.

---

## 5. FORBIDDEN CLAIMS — never state these

These are capabilities the product does **not** have, or claims that are legally/factually unsafe. Never write them, never imply them, never let a comparison table imply them by omission.

**Capabilities that do NOT exist:**
1. **No cloud / no cloud storage / no cloud sync.** Never say data is "backed up to the cloud," "synced across devices," or "accessible from anywhere."
2. **No SMS / WhatsApp / email sending to patients.** The product does **not** send messages. ⚠️ The Features page says "תזכורות אוטומטיות לפני כל פגישה" — these are **on-screen / in-app calendar reminders to the clinician only**. Never imply the app texts, WhatsApps, or emails patients. Never say "SMS reminders," "אישור הגעה ב-SMS," or "תזכורות ללקוח."
3. **No cloud AI / no AI scribe / no LLM features.** No ChatGPT-style dictation, no AI summarization, no cloud AI of any kind. Do not claim "AI."
4. **No patient portal / no patient app / no patient login.** Patients have no access to anything.
5. **No roles / permissions / multi-user access control.** Do not claim "team management," "role-based access," "staff accounts," or "clinic-wide multi-seat administration."
6. **No integration with kupot cholim (health funds), Ministry of Health systems, national records, labs, or pharmacies.** No e-prescribing to external systems.
7. **No mobile app** in the standard product (mobile appears only as a contact-only enterprise add-on — do not market it).
8. **No API / data export via API** in the standard product (enterprise-only, custom — do not market it).
9. **No online booking / patient self-scheduling.** The calendar is clinician-side only.
10. **No telehealth / video visits.**

**Unsafe or unsubstantiated claims (do not use without proof/owner sign-off):**
11. **"פחות ביטולים ב-50%"** (50% fewer cancellations) — appears in `FeaturesPage` copy but is an **unsubstantiated statistic**. Do NOT repeat it in SEO content, schema, or ads unless the owner can source it. It also implies reminder-driven results the offline product cannot deliver on its own.
12. **"אבטחה ברמה רפואית" / "medical-grade security"** (Hero) — vague, unverifiable superlative; avoid in new indexable content. Describe the actual mechanism instead (local AES-256 encryption, no server).
13. **No compliance guarantees.** Never write "תואם תיקון 13" as an absolute certification, "מבטיח עמידה בתיקון 13," "עומד בכל דרישות החוק," HIPAA, GDPR, or ISO claims. Use supportive framing only ("ארכיטקטורה ששומרת את הנתונים אצלך, בהתאם לרוח תיקון 13").
14. **No customer counts, ratings, testimonials, or "trusted by X clinics"** — there are no reviews/aggregateRating yet (spec §2.3 says add `aggregateRating` only once real reviews exist). Do not fabricate social proof.
15. **No "₪759" and no version number** in customer-facing content (see Discrepancies #1 and §1).
16. **Do not claim "works 100% offline, never touches the internet"** — license activation uses a server (§1 nuance). Say patient data stays offline/on-device.

---

## 6. Approved quotable claims (with numbers)

These are verified, safe, standalone sentences — ideal for GEO (LLM-citable facts), FAQ schema, and money-page first paragraphs. Each is true against the live site.

**Pricing / model:**
- "תשלום חד־פעמי, ללא מנוי חודשי — רישיון לצמיתות." (one-time payment, no monthly subscription, lifetime license)
- "שלוש חבילות: בסיסית ₪899, מקצועית ₪999, וניהול מלאה ₪1,299 — כולן בתשלום חד־פעמי." *(uses live ₪899; if Discrepancy #1 is resolved toward ₪759, update here first.)*
- "החבילה המקצועית עומדת על ₪999 — תשלום אחד, ללא עלות חודשית." (fully safe — 999 is uncontested)
- "שדרוג חבילה מזכה אתכם במלוא הסכום ששילמתם — משלמים רק את ההפרש." (upgrade credits full amount paid; pay only the difference)
- "30 יום החזר כספי מלא." (30-day full money-back)
- "ההתקנה לוקחת פחות מדקה." (install takes under a minute)

**Offline / privacy (the wedge — safest, strongest claims):**
- "כל נתוני המטופלים נשמרים אך ורק על המחשב שלך — אין שרת ואין ענן." (all patient data stored only on your computer — no server, no cloud)
- "התוכנה עובדת במצב אופליין מלא — ניהול תורים, תיעוד ומסמכים ממשיכים לעבוד גם בלי אינטרנט." (fully offline)
- "ClinicFlow אינה רואה, אוספת או מאחסנת נתוני מטופלים בשום אופן." (company cannot see/collect/store patient data)
- "אין מסד נתונים בענן שאפשר לתקוף מרחוק — המידע יושב על הדיסק שלך בלבד." (no cloud DB to attack remotely)
- "גיבוי מוצפן ומוגן בסיסמה — משחזרים על מחשב חדש תוך דקות." (encrypted, password-protected backup; restore in minutes)

**Compliance framing (supportive, not a guarantee):**
- "הנתונים נשארים על המחשב שלך — ארכיטקטורה שמצמצמת את חשיפת המידע בהתאם לרוח תיקון 13." (data stays on your machine — architecture that reduces data exposure in line with Amendment 13)

**Clinical fit:**
- "תיעוד ביקורים עם שדות SOAP מסודרים, ומסמך PDF מוכן בסוף הביקור." (SOAP documentation; PDF ready at end of visit)
- "יומן תורים יומי/שבועי/חודשי עם גרירה לשינוי שעה." (daily/weekly/monthly calendar, drag-to-reschedule)
- "חוות דעת מקצועיות עם תבניות, חתימה וייצוא PDF." (professional opinions with templates, signature, PDF export)

---

## Quick "do / don't" for writers
- **DO** lead with: offline, one-time payment/no subscription, data-stays-on-device, תיקון 13 framing, ₪999 as the safe anchor price.
- **DON'T** state: ₪759, a version number, macOS support (until resolved), SMS/WhatsApp/reminders-to-patients, AI, cloud, API/mobile, roles/multi-user, kupot-cholim integration, patient portal, compliance guarantees, the "50% fewer cancellations" stat, or any customer count/rating.
- **When unsure, omit and flag** — never fill a gap with an invented capability.
