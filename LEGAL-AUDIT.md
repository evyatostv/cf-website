# ClinicFlow — Legal Audit & Policy Blueprint

Last updated: 2026-04-07

---

## Part 1 — Red Flags Found on the Current Website

These are things that expose you to a lawsuit RIGHT NOW. Fix before going live.

---

### 1. Absolute Security Claims You Cannot Guarantee

**Where:** SecuritySection, OfflineBenefits

**What's written:**
- "אפס סיכון לפריצות סייבר, גניבת מידע או דליפות נתונים" — **you cannot promise zero risk**
- "פרטיות מוחלטת" (absolute privacy) — absolute claims are legally dangerous
- "אין חיבור לשרתים חיצוניים" — **this is factually false.** The app connects to Supabase for licensing, activation, and machine fingerprint. A lawyer will find this immediately.
- "אין גיבויים בענן או העתקים חיצוניים" — false. User email, plan, and machine ID are stored in Supabase.

**Fix:** Change to softer language: "נתוני המטופלים אינם נשלחים לשום שרת חיצוני." Add a footnote: "פרטי הרישיון (דוא״ל, גרסה) נשמרים בשרת לצורך ניהול הרישיון בלבד."

---

### 2. Features Section Presents ALL Features as Universal

**Where:** FeaturesSection (homepage)

**What's written:**
- "חשבוניות וקבלות" — listed as a general feature, but it's only in the Full plan (₪1,299)
- "דוחות וסטטיסטיקות" — listed as general, but only in Professional plan (₪999)
- "חוות דעת רפואיות + חתימה דיגיטלית" — listed as general, but only in Premium plan
- "גיבוי ושחזור" — listed as general, no mention that this is the user's own responsibility

**The risk:** A customer buys the Basic plan (₪759) expecting all homepage features, then finds they're locked out. That's grounds for a consumer complaint and chargeback.

**Fix:** Add a note under the features section: "* זמינות הפיצ'רים תלויה בחבילה הנרכשת. ראו עמוד התמחור לפירוט מלא." OR split features by plan on the homepage.

---

### 3. Fake Reviews on a Product Not Yet Launched

**Where:** ReviewsCarousel

**What's written:**
- 6 reviews with stock Unsplash photos, fake names, all 5 stars
- "מאות רופאים סומכים עלינו מדי יום" — false. The product is in development.

**The risk:** Deceptive advertising under Israeli consumer protection law (חוק הגנת הצרכן). Also, if a journalist or competitor notices, it's a PR disaster.

**Fix:** Either remove the reviews section entirely until you have real customers, OR replace with a "בקרוב" / waitlist section. If you keep mock reviews, label them explicitly as illustrative examples, not real testimonials.

---

### 4. "תמיכה טכנית מלאה" and "נענה תוך 24 שעות" — No SLA Defined

**Where:** CTASection, DashboardPage

**The risk:** "Full technical support" and "24-hour response" are commitments. If a customer can't reach you for 3 days, they can argue breach of contract.

**Fix:** Define what support means in the Terms of Service. Example: "תמיכה טכנית זמינה בימי עבודה א׳–ה׳, 09:00–18:00. זמן תגובה מטרה: עד 48 שעות."

---

### 5. "רישיון לנצח" / "לנצח" — What Happens if the Product Shuts Down?

**Where:** PricingPage, CTASection

**The risk:** "Lifetime license" implies the product will exist forever. If you shut down, customers can sue for a refund or damages.

**Fix:** Add to Terms: "רישיון לנצח מתייחס לגרסה הנרכשת של התוכנה. ClinicFlow שומרת לעצמה את הזכות להפסיק את הפיתוח עם הודעה מוקדמת של 90 יום. במקרה כזה, לא יינתנו החזרים על רישיונות שנרכשו."

---

### 6. No Refund Policy Anywhere

The website charges ₪759–₪1,299 with no mention of refunds. Under Israeli consumer protection law, digital software is generally exempt from the 14-day cooling-off period — but this exemption only holds if you inform the customer before purchase. You currently do not.

**Fix:** Add a clear refund policy before the payment button and in Terms.

---

### 7. Contact Form Sends Nowhere / No Confirmation

**Where:** ContactPage, PremiumContactForm

The forms have no visible backend — no confirmation email, no success state that persists. If someone sends a message and never hears back, they have no proof they tried to contact you.

**Fix:** Show a clear success message + send an auto-confirmation email from info@clinic-flow.co.il.

---

### 8. No Cookie / Tracking Disclosure

The site uses Vercel Analytics and Speed Insights which collect visitor data. Under GDPR (which applies to Israeli businesses serving EU residents) and Israeli privacy law, you need a cookie consent notice or at minimum a disclosure in the Privacy Policy.

---

## Part 2 — Policies You Need

---

### Policy 1: תנאי שימוש (Terms of Service)

**URL:** `/terms`

**Must include:**

1. **Who is the service provider** — full legal name, business registration number (ע.מ. / ח.פ.), address, contact email
2. **What the software is** — desktop application for clinic management, offline operation, Windows/Mac
3. **What the license grants** — single-user, single-machine license; non-transferable; no redistribution
4. **Machine binding** — license is bound to one computer's MAC address; transfer requires written approval
5. **Feature differentiation by plan** — explicit table or reference stating which features belong to which plan
6. **No medical/legal advice** — the software is a management tool, not a medical device; it does not provide clinical decisions, diagnoses, or legal advice
7. **Support terms** — days/hours, response time target, channel (email only)
8. **Refund policy** — no refunds after download/activation (digital product); exception at your discretion within 7 days if the software is non-functional
9. **"Lifetime" license definition** — tied to the purchased version; not a guarantee of future versions or updates
10. **Right to update pricing** — future purchases may be at different prices; existing licenses not affected
11. **Termination** — you may terminate a license for abuse, violation of terms, or chargebacks
12. **Governing law** — Israeli law; jurisdiction: courts of [your city]
13. **Amendments** — you may update Terms with 30 days notice by email

---

### Policy 2: מדיניות פרטיות (Privacy Policy)

**URL:** `/privacy`

**Must include:**

1. **What data you collect:**
   - On the website: email address (signup), name, payment info (via Stripe — you don't store card details)
   - For licensing: email, plan purchased, machine fingerprint (MAC address hash), app version
   - Analytics: anonymous usage data via Vercel Analytics (page views, performance)
   - No patient data is ever collected — patient data stays on the user's machine only

2. **Why you collect it:**
   - Email: account management, license delivery, support
   - Machine fingerprint: license enforcement (one machine per license)
   - Analytics: product improvement (anonymous)

3. **Who you share it with:**
   - Supabase (database hosting, EU/US servers) — license data
   - Stripe (payment processing) — payment data
   - Vercel (hosting + analytics) — anonymous usage data
   - No patient data is ever shared with anyone

4. **How long you keep it:**
   - Account data: as long as the license is active + 7 years (legal obligation)
   - Analytics: as per Vercel's retention policy

5. **User rights:** access, correction, deletion requests via info@clinic-flow.co.il

6. **Cookies:** Vercel Analytics uses cookies/local storage; no marketing cookies

7. **Patient data statement:** "נתוני המטופלים נשמרים אך ורק על מחשב המשתמש. ClinicFlow אינה רואה, אוספת, מעבדת או מאחסנת נתוני מטופלים בשום צורה."

8. **Applicable law:** Israeli Privacy Protection Law 5741-1981 and Regulations

---

### Policy 3: הסרת אחריות על נתונים (Data Liability Disclaimer)

**URL:** `/disclaimer` or include as a section in Terms

**Must include:**

1. **User is solely responsible for backups** — the software saves data locally; ClinicFlow has no access to the user's data; if the computer fails, data is lost; the user must maintain their own backup system (external drive, encrypted USB, cloud backup of their own choosing)

2. **No guarantee of data integrity** — hardware failures, OS crashes, accidental deletion, or malware on the user's computer are beyond ClinicFlow's control and responsibility

3. **No liability for data loss** — ClinicFlow will not compensate for lost, corrupted, or deleted patient records regardless of cause

4. **User's legal obligations** — the user (the clinician) is responsible for complying with Israeli medical record retention laws (generally 7 years), privacy obligations toward patients, and any applicable professional regulations; ClinicFlow is a tool, not a compliance solution

5. **No liability for regulatory non-compliance** — the software does not guarantee compliance with any specific medical regulatory body; the clinician bears full responsibility for how they use the software

6. **Software provided "as-is"** — ClinicFlow does not warrant that the software is error-free, uninterrupted, or fit for any specific clinical purpose

7. **Limitation of liability cap** — ClinicFlow's total liability in any case is limited to the amount the customer paid for the license

---

### Policy 4: מדיניות החזרים (Refund Policy)

**URL:** `/refund` or within Terms

**Must include:**

1. **General rule:** Digital software licenses are non-refundable after activation
2. **Exception:** If the software fails to install or function on a supported OS within 7 days of purchase, a full refund may be requested via email
3. **Process:** Email info@clinic-flow.co.il with your order number; refunds processed within 14 business days
4. **No refunds for:** change of mind, purchase of wrong plan (upgrades available), hardware incompatibility after activation, or lack of use
5. **Chargebacks:** initiating a chargeback without contacting support first will result in immediate license termination

---

### Policy 5: הסכם רישיון משתמש קצה — EULA (End User License Agreement)

**Shown at:** first app launch (checkbox before using the app)

**Must include:**

1. Single-user, single-machine license
2. No reverse engineering, decompiling, or redistribution
3. License is personal and non-transferable without written approval
4. Machine binding acknowledgment
5. "As-is" disclaimer
6. Data backup responsibility acknowledgment
7. No patient data leaves the machine
8. Clinician is responsible for regulatory compliance
9. ClinicFlow may terminate license for Terms violations

---

### Policy 6: הצהרת נגישות (Accessibility Statement)

**Required by:** Israeli Equal Rights for Persons with Disabilities Regulations 2013 (if your site is a commercial service)

**Must include:** commitment to accessibility, known limitations, contact for accessibility issues

---

## Part 3 — Where to Add Policy Links

- **Footer:** links to Terms, Privacy, Refund, Disclaimer on every page
- **Signup page:** "על ידי הרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו" with links
- **Payment page:** "על ידי רכישה אתה מסכים למדיניות ההחזרים שלנו" with link, shown before the payment button
- **App first launch:** EULA checkbox, must be accepted before use

---

## Part 4 — Summary Priority List

| Priority | Issue | Action |
|----------|-------|--------|
| 🔴 Critical | "אפס סיכון" / "אין חיבור לשרתים" — false claims | Rewrite security section copy |
| 🔴 Critical | Fake reviews + "מאות רופאים" claim | Remove or replace with honest placeholder |
| 🔴 Critical | No refund policy before payment | Write and display Refund Policy |
| 🔴 Critical | Features shown as universal, not plan-specific | Add asterisk + note on homepage |
| 🟠 High | No Terms of Service | Write and publish |
| 🟠 High | No Privacy Policy | Write and publish |
| 🟠 High | No Data Liability Disclaimer | Write and include in Terms |
| 🟠 High | "24 שעות" support promise — no SLA defined | Define support hours in Terms |
| 🟡 Medium | No EULA in app | Add on first launch |
| 🟡 Medium | No cookie disclosure | Add to Privacy Policy + banner |
| 🟡 Medium | "לנצח" license — not legally defined | Define in Terms |
| 🟡 Medium | No accessibility statement | Write minimal statement |
| 🟢 Low | Contact form — no auto-confirmation | Add confirmation email |
