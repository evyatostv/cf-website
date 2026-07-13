# ClinicFlow — מדריך הקמה: Google Search Console + Bing Webmaster Tools

_מקור אמת: `product-facts.md` (2026-07-12). מדריך תפעולי לבעלים — צעד-אחר-צעד, כולל תיאורי מסך._
_אתר קנוני: **https://www.clinic-flow.co.il** (הדומיין ללא www מפנה אוטומטית ל-www — ראו סעיף 0)._

---

## 0. שלוש עובדות טכניות שחייבים לדעת לפני שמתחילים

1. **הכתובת הקנונית היא עם www.** בקובץ `vercel.json` מוגדרת הפניה קבועה (301) מ-`clinic-flow.co.il` אל `https://www.clinic-flow.co.il`. לכן בכל מקום שמבקש כתובת מדויקת (נכס URL-prefix, שליחת Sitemap, בקשות אינדוקס) — מקלידים **תמיד עם https ועם www**.
2. **מפת האתר כבר קיימת ומתעדכנת אוטומטית.** כל build מייצר `sitemap.xml` עם כל העמודים הציבוריים (סקריפט `scripts/postbuild-seo.mjs`). הכתובת: `https://www.clinic-flow.co.il/sitemap.xml`. לא צריך ליצור כלום — רק להגיש אותה.
3. **קובץ robots.txt חוסם בכוונה עמודי אפליקציה** (`/login`, `/signup`, `/dashboard`, `/payment` ועוד). אם Search Console ידווח שעמודים אלה "נחסמו על ידי robots.txt" — **זה תקין ומכוון**, לא תקלה.

**מה צריך ביד לפני שמתחילים:**
- חשבון Google של העסק (זה שינהל את הנכס). ⚠️ TODO לבעלים: להחליט איזה חשבון — מומלץ חשבון עסקי, לא אישי.
- גישה לניהול ה-DNS של הדומיין `clinic-flow.co.il` — אצל רשם הדומיינים שבו נרכש הדומיין, או ב-Vercel אם שרתי ה-DNS הועברו לשם (בודקים: Vercel → Project → Settings → Domains. אם כתוב שם "Nameservers: Vercel" — ה-DNS מנוהל ב-Vercel).

---

## 1. Google Search Console — הקמת נכס Domain (הדרך המומלצת: אימות DNS TXT)

נכס מסוג **Domain** מכסה בבת אחת את כל הווריאציות: עם/בלי www, http/https, וכל סאב-דומיין עתידי. זו האפשרות הנכונה כברירת מחדל.

### שלב 1.1 — כניסה והוספת נכס

1. גולשים אל **https://search.google.com/search-console** ומתחברים עם חשבון Google של העסק.
2. אם זה החשבון הראשון — מסך הפתיחה מציג ישר שתי קוביות בחירה. אם כבר יש נכסים — לוחצים על התפריט הנפתח בפינה (בממשק עברי: פינה שמאלית-עליונה) ובוחרים **"הוספת נכס" / "Add property"**.

> [צילום מסך: מסך "Select property type" ובו שתי קוביות זו לצד זו — משמאל קובייה כהה בשם **Domain** עם שדה טקסט אחד ("example.com"), מימין קובייה בשם **URL prefix** עם שדה כתובת מלאה. מתחת לכל קובייה כפתור CONTINUE.]

3. בקוביית **Domain** מקלידים בדיוק: `clinic-flow.co.il` — **בלי** https, **בלי** www, **בלי** לוכסן בסוף.
4. לוחצים **המשך / CONTINUE**.

### שלב 1.2 — קבלת רשומת ה-TXT

5. נפתח חלון "אימות בעלות באמצעות רשומת DNS". Google מציג מחרוזת אימות שנראית כך:

   ```
   google-site-verification=AbCdEfGh1234567890_XXXXXXXXXXXXXXXXXXXX
   ```

> [צילום מסך: חלון "Verify domain ownership via DNS record" עם רשימה נפתחת שבה כתוב "Any DNS provider", תיבת קוד אפורה עם מחרוזת ה-google-site-verification, כפתור COPY לצידה, ולמטה כפתורי VERIFY ו-VERIFY LATER.]

6. לוחצים **COPY**. **לא סוגרים את החלון** (או לוחצים VERIFY LATER — המחרוזת נשמרת וניתן לחזור אליה).

### שלב 1.3 — הוספת הרשומה ב-DNS

**אם ה-DNS מנוהל ב-Vercel:**
1. נכנסים ל-**vercel.com** → הפרויקט של האתר → **Settings → Domains** → ליד `clinic-flow.co.il` לוחצים **Edit / Manage DNS** (או: Dashboard → Domains → הדומיין → **DNS Records**).
2. מוסיפים רשומה חדשה:
   - **Type:** `TXT`
   - **Name:** משאירים ריק או `@` (כלומר — הדומיין הראשי עצמו, לא www)
   - **Value:** מדביקים את כל המחרוזת שהועתקה, כולל הקידומת `google-site-verification=`
3. לוחצים **Add**.

> [צילום מסך: טופס DNS Records ב-Vercel — שדה Name ריק, שדה Type עם TXT נבחר, שדה Value עם המחרוזת המודבקת, כפתור Add כחול.]

**אם ה-DNS אצל רשם דומיינים ישראלי (למשל דומיין המרכז הישראלי, Box, interspace וכו'):**
1. מתחברים לאזור האישי אצל הרשם → ניהול הדומיין `clinic-flow.co.il` → **ניהול רשומות DNS / DNS Zone**.
2. מוסיפים רשומת **TXT** על השורש (`@` או שדה מארח ריק) עם הערך שהועתק. TTL — ברירת המחדל בסדר.
3. שומרים.

⚠️ לא מוחקים ולא משנים שום רשומה קיימת (A / CNAME / MX) — רק **מוסיפים** TXT חדשה. מחיקת רשומות קיימות תפיל את האתר או את המייל.

### שלב 1.4 — אימות

1. ממתינים. בדרך כלל ההפצה לוקחת **5 דקות עד שעה**; במקרים נדירים עד 48 שעות.
2. אפשר לבדוק שהרשומה כבר חיה, בטרמינל: `dig TXT clinic-flow.co.il +short` — צריך להופיע הערך `google-site-verification=...`.
3. חוזרים ל-Search Console (אם סגרתם — Add property → Domain → אותו דומיין; המחרוזת נשמרה) ולוחצים **VERIFY / אימות**.

> [צילום מסך: חלונית ירוקה עם וי גדול — "Ownership verified" / "הבעלות אומתה", וכפתור GO TO PROPERTY.]

4. **חשוב:** משאירים את רשומת ה-TXT ב-DNS לתמיד. Google בודק אותה מדי פעם — מחיקה תבטל את האימות.

---

## 2. חלופה: נכס URL-prefix עם אימות קובץ HTML (אם אין גישה ל-DNS)

משתמשים בדרך הזו רק אם אין דרך להוסיף רשומת TXT (למשל אין גישה לרשם). אפשר גם להקים את **שני** הנכסים — זה לא מזיק, ונכס URL-prefix מאפשר בעתיד להוסיף משתמשים עם הרשאה חלקית.

1. Search Console → **Add property** → הפעם בוחרים בקוביית **URL prefix** ומקלידים במדויק: `https://www.clinic-flow.co.il` (עם https ועם www — בגלל ההפניה מסעיף 0).
2. בחלון האימות בוחרים בשיטה הראשונה: **HTML file**. Google מציע להוריד קובץ בשם בסגנון `google1234567890abcdef.html`.

> [צילום מסך: חלון "Verify ownership" עם רשימת שיטות: HTML file (מסומן Recommended), HTML tag, Google Analytics, Google Tag Manager, Domain name provider. תחת HTML file — כפתור הורדה של הקובץ ושורת הסבר "Upload to: https://www.clinic-flow.co.il/".]

3. מורידים את הקובץ ומעבירים אותו למי שמתחזק את הקוד (או שמים בעצמכם): הקובץ נכנס לתיקיית **`public/`** בפרויקט האתר (`cf-website/public/google...html`) — כל מה שבתיקייה זו מוגש מהשורש של הדומיין. עושים commit + deploy ל-Vercel.
4. בודקים בדפדפן שהקובץ עונה: `https://www.clinic-flow.co.il/google1234567890abcdef.html` — אמור להופיע טקסט קצר של שורה אחת (`google-site-verification: ...`). הקובץ מוגש ישירות כי ב-Vercel קבצים סטטיים קודמים ל-rewrites — ה-catch-all של האפליקציה לא יבלע אותו.
5. חוזרים ל-Search Console ולוחצים **VERIFY**.
6. **לא מוחקים את הקובץ אף פעם** — הוא חייב להישאר ב-`public/` כל עוד רוצים שהאימות יחזיק.

---

## 3. הגשת מפת האתר (Sitemap)

1. בתפריט הצד של Search Console (בנכס שאומת) לוחצים **Sitemaps / מפות אתר** (תחת הקטגוריה "Indexing / הוספה לאינדקס").
2. בשדה "Add a new sitemap" — הנכס כבר מציג את קידומת הדומיין; מקלידים רק: `sitemap.xml`
3. לוחצים **SUBMIT / שליחה**.

> [צילום מסך: עמוד Sitemaps — למעלה שדה טקסט עם הקידומת https://www.clinic-flow.co.il/ ולידו כפתור SUBMIT. למטה טבלת "Submitted sitemaps" ובה שורה אחת: sitemap.xml, תאריך הגשה, Status ירוק: "Success", ומספר בעמודת Discovered pages.]

4. תוך דקות עד ימים הסטטוס יהפוך ל-**Success** ויוצג מספר העמודים שהתגלו. אם מופיע "Couldn't fetch" — ממתינים יום ובודקים שוב; אם נמשך, בודקים שהכתובת `https://www.clinic-flow.co.il/sitemap.xml` נפתחת בדפדפן ומציגה XML.
5. פעולה חד-פעמית — ה-sitemap מתעדכן אוטומטית בכל deploy, ו-Google חוזר אליו לבד.

---

## 4. בקשת אינדוקס לעמודים המרכזיים (URL Inspection)

Google יגיע לכל העמודים דרך ה-sitemap, אבל בקשת אינדוקס ידנית מזרזת את העמודים החשובים. יש מכסה יומית (בערך 10–12 בקשות ליום) — עושים את זה בשני ימים אם צריך.

לכל אחת מהכתובות הבאות, לפי הסדר:

| עדיפות | כתובת |
|---|---|
| 1 | `https://www.clinic-flow.co.il/` |
| 2 | `https://www.clinic-flow.co.il/pricing` |
| 3 | `https://www.clinic-flow.co.il/features` |
| 4 | `https://www.clinic-flow.co.il/about` |
| 5 | `https://www.clinic-flow.co.il/contact` |
| 6 | `https://www.clinic-flow.co.il/blog` |
| 7+ | כל פוסט בלוג חדש שעולה (`/blog/...`) — מבקשים אינדוקס ביום הפרסום |

התהליך לכל כתובת:
1. מדביקים את הכתובת המלאה בשורת החיפוש שבראש המסך של Search Console (זהו כלי **URL Inspection / בדיקת כתובת URL**) ומקישים Enter.
2. מתקבל אחד משני מצבים:
   - "URL is on Google" — העמוד כבר באינדקס. מצוין, עוברים הלאה.
   - "URL is not on Google" — לוחצים **REQUEST INDEXING / בקשה להוספה לאינדקס**. Google מריץ בדיקה חיה של כדקה ואז מאשר שהעמוד נכנס לתור.

> [צילום מסך: תוצאת URL Inspection — כרטיס עליון עם וי אפור וכיתוב "URL is not on Google", מתחתיו קישור-כפתור "REQUEST INDEXING", ולידו "TEST LIVE URL". אחרי הלחיצה — חלונית "Indexing requested" עם וי ירוק.]

3. אינדוקס בפועל לוקח בין שעות לשבועות. אתר חדש מתאנדקס לאט בהתחלה — זה נורמלי.

---

## 5. Bing Webmaster Tools — חשוב יותר משנדמה

**למה לטרוח עם Bing:** גלישת האינטרנט של ChatGPT (וחלק ממנועי תשובות נוספים) נשענת על האינדקס של Bing. מטפל ששואל את ChatGPT "תוכנה לניהול קליניקה בלי מנוי" יקבל תשובות שמבוססות על מה ש-Bing מכיר. בלי אינדוקס ב-Bing — ClinicFlow שקופה לחלק מה-GEO. עשר דקות עבודה, פעם אחת.

> הערה: קובץ `public/robots.txt` באתר כבר מזמין במפורש את סורקי מנועי התשובות (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Bingbot) עם `Allow: /`. כלומר צד הסריקה מוכן — הצעד היחיד שחסר הוא לוודא שהתוכן באינדקס של Bing, וזה מה שסעיף זה עושה. אין צורך לגעת ב-robots.txt.

### הדרך הקצרה — ייבוא מ-Google Search Console

1. גולשים אל **https://www.bing.com/webmasters** ולוחצים **Sign in**. אפשר להתחבר עם חשבון Google, Microsoft או Facebook — **בוחרים להתחבר עם אותו חשבון Google שאימת את Search Console.**
2. במסך הפתיחה מוצגות שתי אפשרויות זו לצד זו:

> [צילום מסך: מסך onboarding של Bing Webmaster Tools עם שתי קוביות — משמאל "Import your sites from GSC" עם לוגו Google וכפתור Import, מימין "Add your site manually" עם שדה URL. ]

3. לוחצים **Import** בקוביית ה-GSC → מאשרים את חלון ההרשאות של Google (Bing מבקש הרשאת קריאה לנתוני Search Console) → מוצגת רשימת הנכסים המאומתים → מסמנים את `clinic-flow.co.il` → **Import**.
4. זהו. הייבוא מעביר את האימות **ואת ה-sitemap** — לא צריך לאמת שוב ולא להגיש שוב. בודקים תחת **Sitemaps** בתפריט הצד שאכן מופיע `https://www.clinic-flow.co.il/sitemap.xml` עם סטטוס Success; אם לא — מגישים ידנית באותו מסך (Submit sitemap).

### אם הייבוא לא עובד — הוספה ידנית

1. באותו מסך בוחרים **Add your site manually** ומקלידים `https://www.clinic-flow.co.il`.
2. Bing מציע שלוש שיטות אימות: קובץ XML (`BingSiteAuth.xml` — מניחים ב-`public/` בדיוק כמו קובץ Google בסעיף 2), תג meta, או רשומת CNAME ב-DNS. הקובץ ב-`public/` הוא הפשוט ביותר.
3. אחרי האימות: **Sitemaps → Submit sitemap** → מדביקים `https://www.clinic-flow.co.il/sitemap.xml`.
4. אופציונלי אך מומלץ: תחת **URL Submission** אפשר להגיש ידנית את אותם עמודי מפתח מסעיף 4 — ל-Bing יש מכסה נדיבה יותר מ-Google.

---

## 6. מה בודקים כל שבוע (10 דקות, יום קבוע)

### ב-Google Search Console

| # | איפה | מה בודקים | מה תקין / מתי לפעול |
|---|---|---|---|
| 1 | **Performance / ביצועים** | Clicks, Impressions, שאילתות מובילות, עמודים מובילים. מסמנים טווח "28 ימים אחרונים" ומשווים לתקופה הקודמת | בחודשים הראשונים המספרים קטנים — מחפשים **מגמה**, לא גודל. לרשום כל שבוע: קליקים, חשיפות, ו-3 שאילתות חדשות שהופיעו. שאילתות חדשות = רעיונות לפוסטים |
| 2 | **Indexing → Pages / עמודים** | כמה עמודים "Indexed" מול "Not indexed", והסיבות | "Blocked by robots.txt" על עמודי login/dashboard — **מכוון, להתעלם**. "Discovered – currently not indexed" על עמוד חדש — נורמלי בשבועות הראשונים. לפעול רק אם עמוד שיווקי (features/pricing/blog) מופיע עם שגיאה אדומה (404, Server error, Redirect error) |
| 3 | **Sitemaps** | שהסטטוס עדיין Success ושמספר העמודים שהתגלו גדל אחרי פרסום פוסטים | "Couldn't fetch" מתמשך = בעיה ב-deploy — לבדוק את הכתובת בדפדפן |
| 4 | **Security & Manual Actions** (שני מסכים בתפריט) | שכתוב "No issues detected" בשניהם | כל דבר אחר = דחוף, לטפל באותו יום |
| 5 | אחרי פרסום פוסט חדש | URL Inspection לכתובת הפוסט → Request indexing | ראו סעיף 4 |

### ב-Bing Webmaster Tools (אפשר פעם בשבועיים)

| # | איפה | מה בודקים |
|---|---|---|
| 1 | **Search Performance** | קליקים וחשיפות — גם כאן מגמה, לא גודל |
| 2 | **Site Explorer / Sitemaps** | שהעמודים החדשים נסרקו ושה-sitemap בסטטוס Success |
| 3 | **SEO Reports** | Bing נותן דוח שגיאות טכניות בחינם — מתקנים רק מה שנוגע לעמודים שיווקיים |

### פעם בחודש

- להשוות: אילו עמודים מקבלים חשיפות אבל מעט קליקים (Performance → Pages, למיין לפי Impressions)? אלה מועמדים לשיפור כותרת/description.
- לבדוק שהשאילתה `clinicflow` ו-`clinic flow` מציגות את האתר במקום הראשון (חיפוש מותג). אם לא — יש בעיית מותג, לתעד ולטפל.
- לוודא שרשומת ה-TXT עדיין ב-DNS ושקובצי האימות עדיין ב-`public/` (אם השתמשתם בסעיף 2/5).

---

## 7. תקלות נפוצות ופתרונן

| תסמין | סיבה | פתרון |
|---|---|---|
| VERIFY נכשל בנכס Domain | רשומת ה-TXT עוד לא הופצה | להמתין שעה ולנסות שוב; לבדוק עם `dig TXT clinic-flow.co.il +short` |
| קובץ האימות מחזיר את עמוד הבית במקום את תוכן הקובץ | הקובץ לא הגיע ל-`public/` או שה-deploy לא רץ | לוודא שהקובץ ב-`public/` בשורש (לא בתת-תיקייה) ושבוצע deploy |
| הגשתי נכס `http://clinic-flow.co.il` וה-נתונים ריקים | נכס URL-prefix תופס רק את הווריאציה המדויקת; האתר חי על `https://www` | להשתמש בנכס Domain, או ב-URL-prefix המדויק `https://www.clinic-flow.co.il` |
| עמודי `/login`, `/dashboard` מדווחים כחסומים | robots.txt חוסם אותם בכוונה | להתעלם — זה התכנון |
| "Page with redirect" על הגרסה בלי www | ההפניה הקבועה מ-vercel.json | תקין — Google מבין שהקנוני הוא www |
| פוסט חדש לא באינדקס אחרי שבועיים | אתר צעיר, תקציב סריקה נמוך | Request indexing ידני + קישור פנימי אל הפוסט מעמוד הבית/בלוג |

---

## 8. סיכום — רשימת ביצוע חד-פעמית

- [ ] אימות נכס **Domain** (`clinic-flow.co.il`) ב-Google Search Console דרך רשומת TXT ב-DNS (סעיף 1)
- [ ] (אופציונלי/גיבוי) נכס **URL-prefix** `https://www.clinic-flow.co.il` עם קובץ HTML ב-`public/` (סעיף 2)
- [ ] הגשת `sitemap.xml` (סעיף 3)
- [ ] Request indexing ל-6 עמודי המפתח (סעיף 4)
- [ ] Bing Webmaster Tools — ייבוא מ-GSC כולל sitemap (סעיף 5)
- [ ] לקבוע תזכורת שבועית קבועה ביומן: "בדיקת Search Console — 10 דקות" (סעיף 6)
- [ ] ⚠️ TODO לבעלים: לתעד היכן מנוהל ה-DNS של `clinic-flow.co.il` (רשם / Vercel) ובאיזה חשבון Google בוצע האימות — במסמך סיסמאות של העסק
