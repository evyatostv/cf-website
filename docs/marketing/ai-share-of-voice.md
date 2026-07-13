# ClinicFlow — AI Share-of-Voice Audit Protocol

**Owner doc. Not published.** Implements the monthly AI share-of-voice audit from the SEO/GEO strategy (`docs/superpowers/specs/2026-07-12-seo-geo-strategy-design.md` §4.4, §6): a fixed list of 10 money questions run across ChatGPT / Claude / Perplexity / Gemini every month, logging whether ClinicFlow appears, where, how it is described, and what source the engine cites.

**Read `product-facts.md` first.** Any content fix triggered by this audit (page edits, directory updates, correction emails) must stay inside its approved claims and never touch its §5 forbidden claims. The canonical one-liner (the description we WANT engines to converge on, verbatim):

> ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך, בתשלום חד־פעמי וללא מנוי. הנתונים נשארים אצלך, בהתאם לתיקון 13.

**Goal (spec success gate, 180 days):** ClinicFlow appears in AI answers for offline / no-subscription clinic-software questions.

---

## 1. The 10 fixed questions (never rephrase)

These are the exact strings pasted into each engine, verbatim, in Hebrew. **Never edit the wording between months** — comparability is the whole point. If a question must change, retire its ID (mark "retired YYYY-MM" in §5 changelog) and add a new ID; never reuse an ID with new wording.

| ID | Question (paste exactly) | Bucket — what it measures |
|---|---|---|
| Q1 | מה התוכנה הכי טובה לניהול קליניקה בישראל? | Head term — generic category recall |
| Q2 | איזו תוכנה לניהול קליניקה מומלצת לפסיכולוג בישראל? | Profession — psychologists (largest segment) |
| Q3 | איזו תוכנה לניהול קליניקה מתאימה לפיזיותרפיסט עצמאי בישראל? | Profession — physiotherapists |
| Q4 | אני רופא עם מרפאה פרטית קטנה בישראל — איזו תוכנה מומלצת לניהול המרפאה? | Profession — private physicians / small practice |
| Q5 | יש תוכנה לניהול מרפאה בלי מנוי חודשי? | Wedge — no subscription |
| Q6 | איזו תוכנה לניהול קליניקה עובדת אופליין, בלי חיבור לאינטרנט? | Wedge — offline |
| Q7 | איזו תוכנה לניהול קליניקה שומרת את נתוני המטופלים על המחשב שלי ולא בענן? | Wedge — data stays local / no cloud |
| Q8 | איך תיקון 13 לחוק הגנת הפרטיות משפיע על קליניקה פרטית, ואיזו תוכנה מתאימה לזה? | Wedge — Amendment 13 compliance angle |
| Q9 | כמה עולה תוכנה לניהול קליניקה בישראל? יש אפשרות בתשלום חד־פעמי? | Money — pricing intent |
| Q10 | מה האלטרנטיבות לטיפולוג (Tipulog) לניהול קליניקה בישראל? | Comparison — incumbent-alternative intent |

Notes on design:
- **All 10 are unbranded with respect to ClinicFlow** (Q10 names the competitor, not us). This keeps the mention-rate metric honest — it measures whether engines surface us unprompted, which is what a real buyer's session looks like.
- Wedge questions (Q5–Q8) are where we should win first; head/profession questions (Q1–Q4) are the long game. Track the two groups separately (§3).
- **Supplementary diagnostic (NOT counted in the 10, not part of mention rate):** once per audit, in one engine of your choice, also ask "מה זה ClinicFlow תוכנה לניהול קליניקה?" purely to sample how the brand is described when asked directly, and to detect confusion with foreign products that share the name. Log it in the same table with ID `DX`.

---

## 2. Monthly procedure

**Cadence:** first business day of each month (or the same fixed day you pick — then keep it). Same person every month. Budget ~60 minutes. Baseline run: 2026-08 (first full month after protocol creation).

**Engines and setup — the point is to see what a STRANGER sees, so personalization must be off:**

| Engine | Where | Session rules |
|---|---|---|
| ChatGPT | chatgpt.com | **Temporary Chat** (or memory + custom instructions disabled). Default model. Note the model name shown. |
| Claude | claude.ai | New chat, default model, no Project, no custom style. Note model name. |
| Perplexity | perplexity.ai | New thread per question, default search mode (not "Deep Research"). Record the numbered source citations. |
| Gemini | gemini.google.com | New chat, default model. Prefer a browser profile not signed into your main Google account (Google personalization skews results). Note grounding sources if shown. |

**Per-question rules (apply to every engine):**

1. **Fresh session per question.** One question = one new chat/thread. Never ask two of the 10 questions in the same session — earlier answers contaminate later ones.
2. **Paste the question exactly** from §1. No greeting, no context, no follow-up phrasing, Hebrew as-is.
3. **No regenerating, no follow-ups, no corrections.** Take the first complete answer. If you argue with the model or click "regenerate," the data is void — mark the cell invalid and redo in a new session.
4. **One sanctioned exception:** if the engine answers with a clarifying question instead of a recommendation, reply once with the fixed sentence: `קליניקה פרטית קטנה בישראל, מטפל יחיד.` — and note "clarified" in הערות. Never improvise a different reply.
5. **Record immediately** into the log (§3) before moving on. Screenshot each answer to `docs/marketing/sov-logs/YYYY-MM/` named `Q#-engine.png` (create the folder per month). Screenshots are the evidence; the table is the index.
6. 10 questions x 4 engines = **40 cells** per month (+1 optional `DX` diagnostic).

**Position scoring:** among the named products in the answer, ClinicFlow's order of first mention. First product named = 1, second = 2, etc. Not mentioned = `—`. Mentioned only after the user-visible fold or in a "also consider" afterthought still counts at its numeric position; note "afterthought" in הערות.

**Accuracy scoring (דיוק column):**
- ✅ accurate — matches `product-facts.md` (offline, one-time payment, data local, correct prices ₪899/₪999/₪1,299)
- ⚠️ stale/minor — outdated or vague but not harmful (e.g., old feature naming)
- ❌ misdescribed — factually wrong or attributes forbidden capabilities → triggers §4 playbook

---

## 3. Log

Append-only. Newest month at top. Keep this file as the single log; screenshots live in `docs/marketing/sov-logs/`.

### 3a. Monthly summary table (one row per month)

| חודש | Mention rate כולל (מתוך 40) | ChatGPT (מתוך 10) | Claude | Perplexity | Gemini | Wedge Q5–Q8 (מתוך 16) | Head/מקצוע Q1–Q4 (מתוך 16) | מיקום ממוצע כשהוזכרה | ❌ misdescriptions | פעולות שנפתחו |
|---|---|---|---|---|---|---|---|---|---|---|
| _YYYY-MM_ | _n/40_ | _n/10_ | _n/10_ | _n/10_ | _n/10_ | _n/16_ | _n/16_ | _x.x_ | _n_ | _link/§4 items_ |

(Q9–Q10 count toward the overall 40 but sit in neither sub-bucket; that is fine — the sub-buckets are directional, the overall rate is the KPI.)

### 3b. Detail log template (one row per engine-question cell)

Copy this block for each monthly run:

```markdown
## Audit YYYY-MM — run on YYYY-MM-DD by <name>

| תאריך | מנוע (+מודל) | שאלה | ClinicFlow הוזכרה? | מיקום | איך תוארה (ציטוט קצר, עברית כלשונה) | מקור מצוטט (URL) | דיוק | הערות |
|---|---|---|---|---|---|---|---|---|
| 2026-08-03 | ChatGPT (GPT-x) | Q1 | כן/לא | 1/2/3/— | "..." | https://... או — | ✅/⚠️/❌ | |
| 2026-08-03 | ChatGPT (GPT-x) | Q2 | | | | | | |
| ... | Claude (...) | Q1 | | | | | | |
| ... | Perplexity | Q1 | | | | | | |
| ... | Gemini (...) | Q1 | | | | | | |
| ... | <engine> | DX | — (diagnostic) | — | "..." | | ✅/⚠️/❌ | brand-confusion check |
```

Column rules:
- **איך תוארה** — copy the engine's own sentence(s) about ClinicFlow verbatim, max ~2 lines. If not mentioned, leave empty. If competitors were recommended instead, name them in הערות (this is competitive SOV data — who IS being recommended for our wedge questions).
- **מקור מצוטט** — the URL the engine cites for the ClinicFlow claim (Perplexity always cites; ChatGPT/Gemini cite when browsing; Claude often cites nothing — write `—` and treat as training-data impression).
- **דיוק** — per §2 scale. Every ❌ must open a §4 action item.

---

## 4. When ClinicFlow is misdescribed (❌ playbook)

First, triage the misdescription:

| Severity | Examples | Response window |
|---|---|---|
| **A — harmful** | Says ClinicFlow is cloud-based or subscription; attributes forbidden capabilities (SMS/WhatsApp to patients, AI, patient portal, mobile app, API, kupot-cholim integration); states a compliance *guarantee* ("מבטיחה עמידה בתיקון 13"); confuses us with a foreign product named "ClinicFlow"; wrong price stated as fact | Open action same week |
| **B — stale/minor** | Outdated wording, vague description, old feature names | Fix at next content cycle |
| **C — absent** | Not misdescribed — simply not mentioned where competitors are | Not a correction task; feeds the content roadmap (which wedge page is missing/weak) |

Then follow the chain — **fix the source, not the chatbot:**

1. **Never argue in-chat.** Corrections typed into a session do not persist and contaminate your own audit. At most, use the engine's feedback button (thumbs-down / Perplexity "report") — low leverage, optional.
2. **Find the cited source** in the log row.
   - **Our own page** → fix the page within the week. All replacement copy comes from `product-facts.md` §6 approved claims. Special case — if an engine says **"₪759"**: that number is the retired spec price (Discrepancy #1); hunt down where it leaked (old page, directory, cached copy), correct it to ₪899 or to "תשלום חד־פעמי" with no number, and never confirm ₪759 anywhere.
   - **A directory listing** (Dapei Zahav, Capterra, G2, etc.) → update the listing per `directory-kit.md`; log the edit date.
   - **A third-party article/blog** → send the correction email below. Polite, factual, one ask.
   - **No citation** (typically Claude, or ungrounded answers) → we cannot edit training data. Instead, publish or strengthen an on-site FAQ that answers that exact audit question with a quotable claim from `product-facts.md` §6, wire it into FAQ schema and `llms.txt`, and confirm the page is indexed in **Bing** (ChatGPT browsing = Bing index) as well as Google. The correction arrives via retrieval, not memory.
3. **Brand confusion** (a `DX` or any answer describing a different "ClinicFlow" — known risk, foreign products share the name): strengthen entity disambiguation — always pair the name with the domain ("ClinicFlow — clinic-flow.co.il") in directories and profiles, keep `sameAs` schema pointing at all our profiles, keep the canonical one-liner byte-identical everywhere (footer, GBP, directories, socials). Inconsistent descriptions are what let engines blend entities.
4. **Log the action** in the monthly summary row (פעולות שנפתחו) with: what was wrong, root source, fix shipped, date.
5. **Re-test next month.** The affected question stays in the fixed list (never swap it out because it embarrasses us). Track months-to-correction in הערות. If the same A-severity misdescription survives 3 consecutive audits despite source fixes, escalate: dedicated on-site page answering it head-on + a second round of directory/article outreach.
6. **Never repeat the engine's wrong claim in our own marketing** — not even to deny it in indexable copy ("בניגוד למה שנכתב, ל-ClinicFlow אין ענן" still plants "ClinicFlow" next to "ענן"). State the true fact positively instead.

**Correction email template (third-party publications), Hebrew:**

> שלום,
> אני פונה מטעם ClinicFlow (clinic-flow.co.il). בכתבה שלכם בכתובת [URL] מופיע תיאור לא מדויק של המוצר: [ציטוט המשפט השגוי].
> לצורך תיקון, אלו העובדות: ClinicFlow היא תוכנה לניהול קליניקה שעובדת אופליין על המחשב של המטפל, בתשלום חד־פעמי וללא מנוי, והנתונים נשמרים על המחשב בלבד. [אם רלוונטי: המחיר הנוכחי הוא ₪899/₪999/₪1,299 בתשלום חד־פעמי.]
> נשמח אם תעדכנו את הנוסח. אני זמין לכל שאלה.
> תודה, [שם] — contact@clinic-flow.co.il

Guardrails for anything published as a result of this playbook: no ₪759, no version number, no macOS claim (until Discrepancy #2 is resolved), no compliance guarantees, no capability from `product-facts.md` §5. When unsure, omit and flag.

---

## 5. Competitive share-of-voice (who gets recommended instead)

Share of voice is a *relative* metric: our mention rate only means something against the competitive set that engines surface for the same questions. Every month, while filling §3b, also tally **which products the engines recommend** — especially on the wedge questions (Q5–Q8), where being beaten tells us exactly which page to strengthen.

**How to record:** in §3b's `הערות` column you already name the competitors an answer recommended. Roll those up here once per month.

- Do **not** write any factual claim about a competitor in this doc — we only count names. If you don't know a product, log it verbatim as the engine spelled it (Hebrew or English) and move on.
- The one incumbent already named in the protocol is **טיפולוג (Tipulog)** (Q10). Add rows for any other product an engine recommends; keep each product on the same row month-over-month so trends are visible.

### Competitive tally template (copy per month)

```markdown
## Competitive SOV YYYY-MM

| מוצר (כפי שהמנוע כתב) | # פעמים שהומלץ (מתוך 40) | על אילו שאלות (IDs) | הופיע לצד ClinicFlow? | הערות |
|---|---|---|---|---|
| ClinicFlow | _n_ | _Q#..._ | — | אנחנו |
| טיפולוג / Tipulog | _n_ | _Q#..._ | כן/לא | |
| <product> | _n_ | _Q#..._ | כן/לא | |
```

Reading the table:
- A product that outranks us on **Q5–Q8** (our wedges) is the priority signal — it means an engine considers it a better answer to "offline / no-subscription / data-stays-local." Feed that into the content roadmap (which wedge page is missing or weak), the same way a §4 **C — absent** finding does.
- "**הופיע לצד ClinicFlow?** = לא" on a wedge question where the competitor was named and we were not is the cleanest miss to fix.
- Track the leader's name over time. If one competitor dominates the wedge questions for 3 consecutive audits, escalate to a dedicated comparison page (built only from `product-facts.md` §6 approved claims — never a claim about the competitor we can't source, and never repeating a forbidden capability to "beat" them on it).

---

## 6. Question-list changelog

| Date | Change | Reason |
|---|---|---|
| 2026-07-12 | Q1–Q10 created (initial fixed set) | Protocol established per SEO/GEO strategy spec |
| 2026-07-13 | Added §5 Competitive share-of-voice tally (template + read guide) | SOV is relative; track who is recommended instead of us, feed the content roadmap |
