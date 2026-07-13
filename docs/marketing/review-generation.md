# ClinicFlow — Review-Generation Playbook (Google Reviews First)

**Owner doc. Not published.** Implements Phase 3, item 2 of the SEO/GEO strategy (`docs/superpowers/specs/2026-07-12-seo-geo-strategy-design.md`): a repeatable, policy-safe system for earning real Google reviews from paying customers.

**Read `product-facts.md` first.** Every message and reply template below must stay inside its approved claims. The canonical one-liner (use verbatim if a description is ever needed):

> ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך, בתשלום חד־פעמי וללא מנוי. הנתונים נשארים אצלך, בהתאם לתיקון 13.

---

## 0. The one rule above all: NEVER incentivize reviews

**No discount, no gift, no upgrade credit, no raffle, no free add-on, no "we'll feature you," no payment of any kind — ever — in exchange for a review, a positive review, an edited review, or a removed review.**

Why this is absolute:

1. **Google policy.** Incentivized reviews violate Google's review policies. Penalties include mass review removal and suspension of the Business Profile — which would erase the exact asset this playbook exists to build.
2. **Israeli consumer-protection law.** Paid-for or undisclosed-incentive endorsements are deceptive advertising exposure (חוק הגנת הצרכן). A privacy-first, Amendment-13-positioned brand cannot afford a deception finding.
3. **Trust is the product.** ClinicFlow's entire wedge is "you can trust us with the most sensitive data category there is." Fake or bought social proof poisons that positioning permanently.

Corollaries (all also forbidden):

- No **review gating**: do not pre-screen customers ("how happy are you 1–5?") and send the Google link only to the happy ones. Everyone you ask gets the same link and is asked for an **honest** review (ביקורת כנה).
- No reviews from **employees, family, friends, contractors**, or anyone with a stake.
- No **review swaps** with other businesses.
- No offering anything (refund sweeteners, free support hours) to **edit or delete** a negative review. You may ask — politely, with no strings — whether they'd consider updating the review *after* their problem is genuinely fixed.
- No writing or drafting the review text **for** the customer. Never suggest wording, stars, or talking points.
- No bulk blasts. Spread asks over weeks; a sudden spike of same-day reviews looks manufactured and can trigger filtering.

Also remember: **no fabricated social proof anywhere else.** Per `product-facts.md` §5.14, no "trusted by X clinics," no invented ratings. `aggregateRating` schema gets added only once real Google reviews exist (spec §2.3) — that is the payoff of this playbook, in that order.

---

## 1. Why this matters (the goal)

Reviews are not vanity — they are four compounding SEO/GEO assets. Naming the payoff keeps the effort prioritized:

1. **Local-pack ranking.** Review count, velocity, and rating are direct ranking signals for the Google Business Profile (see `gbp-listing.md`). More honest reviews → the profile surfaces higher when a clinician searches "תוכנה לניהול קליניקה" and similar.
2. **Star rich-snippet.** Once the profile has enough reviews, Google shows a star rating in the map/knowledge panel — a click-through multiplier that costs nothing per impression.
3. **Unlocks `aggregateRating` schema.** Real reviews are the precondition (spec §2.3) for adding `aggregateRating` to the site's `SoftwareApplication` schema. Never before, never fabricated — this playbook is what earns the right to that markup.
4. **GEO / LLM citation.** Assistants that recommend clinic software lean on third-party review signals. Genuine, specific reviews from named professions ("פסיכולוגית," "פיזיותרפיסט") give models real, quotable trust evidence — which no marketing page can supply.

**Target before wiring up `aggregateRating`:** a small but real base (rule of thumb: **8–10+ genuine reviews**, rating stable) so the average is not swingy. Quality and honesty over count — five real reviews beat fifty manufactured ones that get filtered.

---

## 2. When to ask (trigger moments)

Ask when the customer has just experienced value. Never ask cold, never ask at purchase time (they haven't used it yet), never ask during an open support issue or an active refund conversation.

| Trigger | Timing | Channel | Notes |
|---|---|---|---|
| **Successful onboarding** | ~7–14 days after purchase, once they confirm the app is installed and they've documented real visits | WhatsApp (if they contacted us there) or email | Best moment: they just went from "risk" to "this works." Confirm success first ("הכל רץ חלק?") — the ask rides on a real conversation, not a blast. |
| **End of first month of active use** | ~30–35 days after purchase | Email | They've passed the 30-day money-back window by choosing to stay — strongest satisfaction signal we have. Primary trigger for customers we had no onboarding conversation with. |
| **Positive support interaction** | Same day, right after they say thanks / confirm the issue is solved | Same channel as the support thread | Highest conversion moment. One line, in-thread. |
| **Upgrade purchase** | 3–7 days after an upgrade (basic → professional/full) | Email or WhatsApp | They voted with their wallet; the credit-the-difference experience is itself review-worthy. |
| **Spontaneous praise** | Immediately, in person / on a call / in chat | In-person or phone script (§4c) | If someone compliments the product unprompted, that is the ask moment. |

**Cadence rules**

- Maximum **one ask + one gentle reminder** per customer, ever. A reminder goes out ~7–10 days after an unanswered ask. After that, drop it permanently.
- Do not ask a customer who left a review already (check before sending — see tracking, §7).
- Do not ask a customer with an unresolved complaint. Fix first. If the fix lands well, the *resolution* becomes the trigger.
- Space asks so reviews trickle in naturally (a few per week at most, not ten in one day). Velocity that looks organic protects the whole profile from filtering.
- One follow-up to an existing customer relationship is fine under Israeli anti-spam norms (תיקון 40 לחוק התקשורת), but honor any "לא מעוניין/ת" instantly and note it in the tracker.

---

## 3. The Google review link (one-time setup)

1. The **Google Business Profile** must exist and be verified first (spec Phase 3, item 1 — GBP listing text is in `gbp-listing.md`). No verified GBP → no review link → this playbook waits.
2. Get the short review link:
   - Search **"ClinicFlow"** on Google while logged in as the profile owner → in the business panel choose **"Ask for reviews" / "בקשת ביקורות"** → copy the short link. It looks like `https://g.page/r/XXXXXXXX/review`.
   - Or manage the profile directly from Google Search/Maps (the standalone `business.google.com` dashboard has been folded into the profile panel) → **"Get more reviews"** → copy the link.
3. That link opens the 5-star review dialog directly — one tap on mobile. Use **this exact link** in every template below.
4. Record the canonical link here once minted: **`TODO: paste g.page review link`**. Do not create multiple shorteners; one canonical link keeps tracking sane.
5. Optional: generate a QR code of the link for in-person moments — but never display it next to any offer, gift, or "leave us 5 stars" wording (see §0). The QR just opens the same honest-review dialog.

---

## 4. Hebrew ask templates

Rules for all templates:

- Personal, short, zero pressure, and explicitly asking for an **honest** review (ביקורת כנה) — never "positive," never "5 stars."
- Sent from a named human (העצמאי/המייסד), not "no-reply."
- The same link goes to everyone asked — no gating.
- Support channel offered alongside, so someone with a problem talks to us — but the review ask is not conditional on being happy.
- Adjust gendered forms (תוכל/י, ספר/י) to the recipient; templates use both forms.
- Do not attach discounts, gifts, or "as a thank-you we'll…" — nothing (§0).

### 4a. WhatsApp version

Use when the relationship already lives in WhatsApp (they wrote to us there first). Keep it to one message.

> היי [שם], כאן [שם השולח] מ־ClinicFlow 🙂
>
> שמחתי לשמוע שהקליניקה כבר עובדת עם התוכנה. אם יש לך דקה, נשמח מאוד לביקורת כנה בגוגל — זה עוזר למטפלים ומטפלות אחרים למצוא פתרון ששומר את נתוני המטופלים אצלם, על המחשב שלהם.
>
> הקישור הישיר: [קישור הביקורת]
>
> ואם משהו לא עובד חלק — ספרו לי כאן ואטפל בזה אישית. תודה רבה!

**WhatsApp reminder (once, 7–10 days later, only if no reply and no review):**

> היי [שם], רק תזכורת קטנה ואחרונה 🙂 אם מתאים לך להשאיר ביקורת כנה על ClinicFlow בגוגל, זה ממש עוזר: [קישור הביקורת]
> אם לא — הכל טוב, לא אציק שוב. תודה!

### 4b. Email version

**Subject:** יש לך דקה? ביקורת כנה על ClinicFlow תעזור למטפלים אחרים

> שלום [שם],
>
> כאן [שם השולח] מ־ClinicFlow. עבר [חודש / שבועיים] מאז שהתחלת לעבוד עם התוכנה, ואני מקווה שהיא חוסכת לך זמן וכאב ראש.
>
> יש לי בקשה קטנה: ביקורת כנה בגוגל. מטפלים ומטפלות שמחפשים תוכנה לקליניקה מסתמכים על חוות דעת של קולגות, וכמה משפטים ממך — מה עובד, מה פחות — שווים יותר מכל דף שיווקי שנכתוב.
>
> כותבים כאן (פחות מדקה): [קישור הביקורת]
>
> ואם נתקלת במשהו שדורש תיקון — פשוט השיבו למייל הזה או כתבו לנו ל־info@clinic-flow.co.il, ונטפל בזה.
>
> תודה רבה,
> [שם השולח]
> ClinicFlow

**Email reminder (once, 7–10 days later):**

**Subject:** תזכורת אחרונה — ביקורת על ClinicFlow

> שלום [שם],
>
> תזכורת קצרה ואחרונה: אם יש לך דקה לכתוב ביקורת כנה על ClinicFlow בגוגל, נשמח מאוד — [קישור הביקורת].
>
> אם זה לא מתאים, זה לגמרי בסדר — לא נשלח תזכורות נוספות.
>
> תודה,
> [שם השולח]

**Upgrade variant** (3–7 days after a basic → professional/full upgrade; swap into the email or WhatsApp body):

> ראיתי ששדרגת ל[שם החבילה] — תודה על האמון! עכשיו כשאת/ה מכיר/ה גם את היכולות המתקדמות, אשמח לביקורת כנה בגוגל שתעזור למטפלים אחרים להחליט: [קישור הביקורת].

*(Never imply the upgrade credit or any refund is tied to writing the review — the credit-the-difference policy applies to everyone regardless; §0.)*

### 4c. In-person / phone script

For the moment a customer says something positive on a call, demo follow-up, or support conversation:

> "תודה, ממש כיף לשמוע. אפשר לבקש טובה קטנה? אם תכתוב/תכתבי את זה — בכנות, גם עם מה שפחות עבד — בביקורת בגוגל, זה עוזר למטפלים אחרים למצוא אותנו. אשלח לך עכשיו את הקישור בוואטסאפ/במייל — זו דקה."

**Phone-only close** (when there is no live chat open and you'll send the link after the call):

> "אני אשלח לך מיד אחרי השיחה קישור קצר במייל/בוואטסאפ — לחיצה אחת ואת/ה בדף הביקורות. בלי לחץ, ומה שתכתוב/תכתבי בכנות זה בדיוק מה שעוזר."

Then send the WhatsApp/email template **the same day** while the moment is warm. If they hesitate or decline — "אין שום בעיה" — drop it and log the decline (§7).

**What the asker must never say:** any hint of reward ("נעשה לך הנחה על השדרוג"), any steering ("חמישה כוכבים יעזרו"), any drafting ("אפשר לכתוב משהו כמו…").

---

## 5. Responding to reviews

Respond to **every** review — positive and negative — within **2–3 business days**, from the owner account, signed "צוות ClinicFlow" or a named person. Responses are public marketing copy: they are read by prospects and quoted by LLMs, so they must obey `product-facts.md` (no forbidden claims, no version numbers, no invented capabilities).

General rules:

- Thank, be specific to something they actually wrote, keep it short (2–4 sentences).
- Never argue, never get defensive, never blame the reviewer.
- Never disclose private details publicly (what they bought, support history, payment issues) — even to prove a point.
- Reviewers are clinicians, but if a review somehow contains patient details, do not repeat or reference them; respond generically and ask Google to review the content if it exposes third-party personal data.
- Move problems to a private channel (`info@clinic-flow.co.il`) fast.
- Never offer anything in exchange for changing/removing a review (§0). After a genuine fix you may add, once: "אם תרצה/י לעדכן את הביקורת — נשמח, אבל אין שום מחויבות."
- Suspected fake/competitor reviews: don't fight in public. Reply once, neutrally ("לא הצלחנו לאתר אתכם במערכת שלנו — נשמח שתפנו ל־info@clinic-flow.co.il"), then report via GBP's "Report review" flow and log it.

### 5a. Positive review — response templates

**Template 1 (standard):**

> תודה רבה, [שם]! שמחים לשמוע ש[פרט אחד ספציפי מהביקורת — למשל: התיעוד בסוף ביקור חוסך לך זמן]. בדיוק בשביל זה בנינו את ClinicFlow — שהנתונים יישארו אצלך והעבודה תהיה פשוטה. לכל שאלה אנחנו זמינים ב־info@clinic-flow.co.il. — צוות ClinicFlow

**Template 2 (privacy-angle review):**

> תודה, [שם]! נקודת הפרטיות שציינת היא לב העניין מבחינתנו — נתוני המטופלים נשמרים אך ורק על המחשב שלך, בלי שרת ובלי ענן. שמחים שזה בא לידי ביטוי בעבודה היומיומית. — צוות ClinicFlow

**Template 3 (short, for short reviews):**

> תודה רבה על המילים החמות, [שם]! עבודה נעימה ורציפה בקליניקה 🙂 — צוות ClinicFlow

### 5b. Negative review — response templates

**Template 1 (standard — problem we can fix):**

> שלום [שם], תודה על המשוב הכן — חשוב לנו לשמוע גם את זה, ומצטערים שהחוויה לא עמדה בציפיות. נשמח להבין בדיוק מה קרה ולתקן: כתבו לנו ל־info@clinic-flow.co.il או השיבו כאן עם דרך ליצירת קשר, ונחזור אליכם במהירות. — צוות ClinicFlow

**Template 2 (missing feature / mismatch of expectations):**

> שלום [שם], תודה על הפידבק. ההערה שלך לגבי [היכולת המבוקשת] הגיעה לצוות המוצר — אנחנו מתעדפים לפי בקשות של מטפלים בשטח. אם תרצו לפרט עוד, נשמח לשמוע ב־info@clinic-flow.co.il. — צוות ClinicFlow
>
> *(Do not promise the feature, a date, or a roadmap item. Do not claim capabilities from the forbidden list — e.g., if they wanted SMS reminders to patients, mobile access, or cloud sync, acknowledge the request without implying it exists or is coming.)*

**Template 3 (already resolved privately):**

> שלום [שם], תודה שעדכנתם אותנו — שמחים שהנושא טופל ושהכל עובד כעת. אנחנו כאן לכל דבר נוסף. — צוות ClinicFlow

**Template 4 (refund-related):**

> שלום [שם], מצטערים שהמוצר לא התאים לצרכים שלכם. כמדיניות, אנחנו מציעים 30 יום החזר כספי מלא — אם זה רלוונטי ולא הושלם, כתבו לנו ל־info@clinic-flow.co.il ונסדיר זאת. תודה על ההזדמנות. — צוות ClinicFlow

---

## 6. Beyond Google (secondary surfaces — Google stays first)

Google is the priority; do not split effort until the GBP has its base of reviews (§1). After that, the **same never-incentivize, no-gating, honest-review rules** apply everywhere below. Only ever point a customer to a secondary surface where they *already* have an account — never make them sign up.

- **Facebook page recommendations.** If ClinicFlow runs a Facebook page (see `community-playbook.md`), the "Recommendations" tab is a natural second home for customers who live on Facebook. Same ask templates, swap the link.
- **B2B software directories (Capterra / GetApp / Software Advice / G2).** These are heavily cited by LLMs when recommending clinic/practice software, so genuine reviews there directly serve GEO. Worth a listing once there is a customer base to draw honest reviews from. Note: some directories solicit reviews with their own gift-card incentives — that is *their* program; **do not run or endorse any incentivized-review flow ourselves** (§0).
- **Israeli local/business directories.** Only where reviews are genuinely useful and the directory is reputable; many are lead-gen and low-signal. Coordinate with `directory-kit.md` so we are not double-listing.

Keep one canonical priority order: **Google first, then wherever a given customer is most comfortable.** Never ask the same person for the same review on three platforms — pick the one that fits them and log it.

---

## 7. Tracking

Keep a lightweight log so nobody is asked twice and velocity stays natural. Add columns to the existing customer tracking sheet (or a dedicated tab):

| Field | Values |
|---|---|
| Customer | name |
| Profession (optional, internal) | psychologist / physio / OT / … — for our own analytics only, never to steer wording |
| Trigger | onboarding / first-month / support-win / upgrade / spontaneous |
| Ask sent | date + channel (WhatsApp / email / in-person / phone) |
| Reminder sent | date or "—" |
| Platform asked | Google / Facebook / directory |
| Outcome | reviewed / declined / no response / do-not-ask |
| Review responded | date of our public reply |

Monthly check: review count and average rating on the GBP. **When there is a meaningful base of real reviews (§1 target), notify the SEO owner to add `aggregateRating` to the `SoftwareApplication` schema** (spec §2.3 — real reviews only, never before).

---

## 8. Quick do / don't

- **DO** ask at value moments (onboarding success, first month, support win, upgrade, spontaneous praise), personally, with the direct g.page link, for an *honest* review.
- **DO** respond to every review within 2–3 business days, publicly and calmly; move problems to info@clinic-flow.co.il.
- **DO** keep all public replies inside `product-facts.md` approved claims.
- **DO** keep Google first; expand to Facebook / directories only after a real Google base exists, under the same rules.
- **DON'T** incentivize — ever, in any form, for writing, improving, or removing a review.
- **DON'T** gate, filter, draft for customers, use employees/family, swap reviews, or blast in bulk.
- **DON'T** argue publicly, reveal customer details, promise features, or repeat forbidden claims (SMS to patients, AI, cloud, mobile, compliance guarantees, ₪759, version numbers).
