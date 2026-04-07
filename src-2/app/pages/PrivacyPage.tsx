export function PrivacyPage() {
  return (
    <div className="pt-32 pb-20 min-h-screen" dir="rtl">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-[#1a2332] mb-2">מדיניות פרטיות</h1>
        <p className="text-sm text-[#6b7c93] mb-10">עדכון אחרון: אפריל 2026 | גרסת מדיניות: 1.0</p>

        <div className="space-y-10 text-[#1a2332]">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. מבוא</h2>
            <p className="text-[#4a5568] leading-relaxed">
              ClinicFlow מחויבת לשמירה על פרטיותך. מדיניות זו מסבירה אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם, ומה אינו נאסף בשום מקרה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. נתוני מטופלים — לא נאספים אצלנו</h2>
            <div className="bg-[#e8f4f8] border border-[#0d47a1]/20 rounded-2xl p-6 mb-4">
              <p className="text-[#1a2332] font-semibold leading-relaxed">
                נתוני המטופלים (רשומות רפואיות, תורים, מסמכים, אנמנזה) נשמרים אך ורק על המחשב של המשתמש.
                ClinicFlow לא רואה, לא אוספת, ולא מאחסנת נתוני מטופלים בשום אופן.
                אנו אין לנו גישה אליהם ואין לנו יכולת להגיש אותם לאף גורם.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. מה כן נאסף</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">א. נתוני חשבון (באתר)</h3>
                <ul className="list-disc list-inside space-y-1 text-[#4a5568]">
                  <li>כתובת דוא״ל — לצורך ניהול חשבון, אספקת רישיון, ותמיכה</li>
                  <li>שם מלא (אם סופק) — לצורך זיהוי ותקשורת</li>
                  <li>פרטי תשלום — מנוהלים על ידי Stripe בלבד; ClinicFlow לא שומרת פרטי כרטיס אשראי</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">ב. נתוני רישיון (בשרת)</h3>
                <ul className="list-disc list-inside space-y-1 text-[#4a5568]">
                  <li>כתובת דוא״ל — לזיהוי הרישיון</li>
                  <li>חבילה שנרכשה וגרסת תוכנה — לצורך ניהול הרישיון</li>
                  <li>טביעת אצבע של המחשב (hash של כתובת MAC) — לאכיפת חד-מחשביות הרישיון</li>
                  <li>תאריך רכישה ואישור תנאים — לצורכי תיעוד משפטי</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">ג. נתוני שימוש אנונימיים (באתר)</h3>
                <ul className="list-disc list-inside space-y-1 text-[#4a5568]">
                  <li>אנליטיקת צפיות בדפים וביצועי טעינה — אנונימית, ללא זיהוי אישי</li>
                  <li>מדדי ביצועים — ללא זיהוי אישי</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. עם מי משותפים הנתונים</h2>
            <ul className="list-disc list-inside space-y-2 text-[#4a5568]">
              <li><strong>ספק בסיס הנתונים</strong> — לניהול נתוני הרישיון והחשבון (שרתים ב-EU/US)</li>
              <li><strong>Stripe</strong> — עיבוד תשלומים; בכפוף למדיניות הפרטיות של Stripe</li>
              <li><strong>ספק אחסון האתר</strong> — אחסון האתר ואנליטיקה אנונימית</li>
              <li>לצרכי שיווק — ייתכן שחלק מהנתונים והמידע ישמשו לצרכי שיווק. לא מועבר מידע אישי מזהה לצדדים שלישיים לצרכים אלה</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. כמה זמן שומרים את הנתונים</h2>
            <ul className="list-disc list-inside space-y-2 text-[#4a5568]">
              <li>נתוני חשבון ורישיון: כל עוד הרישיון פעיל</li>
              <li>נתוני אנליטיקה: לתקופה מוגבלת</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. זכויות המשתמש</h2>
            <ul className="list-disc list-inside space-y-2 text-[#4a5568]">
              <li>עיון בנתונים האישיים שלך השמורים אצלנו</li>
              <li>תיקון נתונים שגויים</li>
              <li>מחיקת חשבון</li>
            </ul>
            <p className="text-[#4a5568] mt-3">לפניות בנושא פרטיות:</p>
            <ul className="list-none space-y-1 text-[#4a5568] mt-1">
              <li>דוא״ל: <a href="mailto:contact@clinic-flow.co.il" className="text-[#0d47a1] hover:underline">contact@clinic-flow.co.il</a></li>
              <li>טלפון: <a href="tel:+972501234567" className="text-[#0d47a1] hover:underline">050-123-4567</a></li>
              <li>כתובת: תל אביב, ישראל</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. עוגיות (Cookies)</h2>
            <p className="text-[#4a5568] leading-relaxed">
              האתר משתמש בעוגיות טכניות לניהול ההתחברות ובאחסון מקומי לצורכי אנליטיקה אנונימית.
              אנו לא משתמשים בעוגיות שיווקיות או עוקבות.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. אבטחת מידע</h2>
            <p className="text-[#4a5568] leading-relaxed">
              אנו מיישמים אמצעי אבטחה סבירים לשמירה על נתוני החשבון (הצפנה בהעברה ובאחסון, הרשאות מוגבלות).
              עם זאת, אין אבטחה מוחלטת בסביבה הדיגיטלית. במקרה של אירוע אבטחה שיכול להשפיע על הנתונים שלך, נודיע לך בהקדם האפשרי.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. חוק החל</h2>
            <p className="text-[#4a5568] leading-relaxed">
              מדיניות זו כפופה לחוק הגנת הפרטיות הישראלי (תשמ"א-1981) ולתקנות שהותקנו מכוחו.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
