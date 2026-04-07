export function DisclaimerPage() {
  return (
    <div className="pt-32 pb-20 min-h-screen" dir="rtl">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-[#1a2332] mb-2">הסרת אחריות על נתונים</h1>
        <p className="text-sm text-[#6b7c93] mb-10">עדכון אחרון: אפריל 2026 | גרסת מדיניות: 1.0</p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
          <p className="text-amber-800 font-semibold leading-relaxed">
            מסמך זה מגדיר את גבולות האחריות של ClinicFlow ביחס לנתונים המנוהלים על ידי המשתמש. קרא אותו בעיון לפני השימוש בתוכנה.
          </p>
        </div>

        <div className="space-y-10 text-[#1a2332]">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. אחריות הגיבוי — על המשתמש בלבד</h2>
            <p className="text-[#4a5568] leading-relaxed mb-3">
              ClinicFlow שומרת נתונים מקומית על מחשב המשתמש. לחברה אין גישה לנתונים אלו ואין לה יכולת לשחזר אותם.
            </p>
            <p className="text-[#4a5568] leading-relaxed font-semibold">
              המשתמש אחראי בלעדית לגיבוי הנתונים שלו בצורה סדירה.
            </p>
            <p className="text-[#4a5568] leading-relaxed mt-3">
              אנו ממליצים לשמור גיבויים ב: כונן USB חיצוני מוצפן, כונן קשיח חיצוני, ו/או שירות ענן פרטי מוצפן (כגון Google Drive, iCloud, Dropbox) — לפי שיקול דעת המשתמש ובהתאם לחוקי הפרטיות.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. אין אחריות לאובדן נתונים</h2>
            <p className="text-[#4a5568] leading-relaxed mb-3">
              ClinicFlow לא תישא בכל אחריות לאובדן, פגיעה, או השחתה של נתונים הנובעים מ:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#4a5568]">
              <li>תקלת חומרה (כשל כונן קשיח, נזק פיזי למחשב)</li>
              <li>כשל מערכת הפעלה או עדכון שגוי</li>
              <li>מחיקה בשוגג על ידי המשתמש</li>
              <li>וירוס, כופרה (ransomware), או פריצה למחשב המשתמש</li>
              <li>כיבוי חשמל פתאומי ללא שמירה</li>
              <li>כל אירוע מחוץ לשליטת ClinicFlow</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. אחריות רגולטורית — על המשתמש</h2>
            <p className="text-[#4a5568] leading-relaxed mb-3">
              המשתמש (איש המקצוע הרפואי) הוא האחראי הבלעדי לעמידה ב:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#4a5568]">
              <li>חוק זכויות החולה ותקנות הרשומות הרפואיות (שמירה של לפחות 7 שנים)</li>
              <li>חוק הגנת הפרטיות ביחס לנתוני מטופלים</li>
              <li>תקנות גוף מקצועי מורשה (רופא, פסיכולוג, פיזיותרפיסט וכד')</li>
              <li>כל דין ותקנה רלוונטיים אחרים</li>
            </ul>
            <p className="text-[#4a5568] leading-relaxed mt-3">
              ClinicFlow היא תוכנת ניהול בלבד. היא אינה מכשיר רפואי, אינה מוסמכת לרגולציה רפואית, ואינה מחליפה ייעוץ משפטי מקצועי.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. אין אחריות לאי-זמינות השירות</h2>
            <p className="text-[#4a5568] leading-relaxed">
              שירותי האינטרנט של ClinicFlow (אתר, שרת הרישיון) עשויים לחוות הפסקות תחזוקה, תקלות, או אירועי כוח עליון.
              ClinicFlow לא תישא באחריות לנזקים הנגרמים מאי-זמינות זמנית של שירותים אלו.
              התוכנה עצמה ממשיכה לפעול ולאפשר ניהול נתונים גם ללא חיבור לשרתי ClinicFlow.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. אין אחריות לאי-קבלת הודעות</h2>
            <p className="text-[#4a5568] leading-relaxed">
              ClinicFlow שולחת הודעות דוא״ל (אישורי רכישה, עדכונים, תמיכה) לכתובת שסופקה בעת ההרשמה.
              ClinicFlow לא תישא באחריות אם הודעות לא הגיעו בשל: כתובת דוא״ל שגויה, סינון ספאם, תיבת דואר מלאה, שגיאות ספק הדוא״ל, או כל גורם מחוץ לשליטת החברה.
              האחריות לעדכון כתובת הדוא״ל הנכונה היא של המשתמש.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. תוכנה "כפי שהיא"</h2>
            <p className="text-[#4a5568] leading-relaxed">
              ClinicFlow מסופקת AS-IS, ללא אחריות מכל סוג — מפורשת או משתמעת.
              לרבות (ללא הגבלה): התאמה למטרה מסוימת, דיוק, אמינות, או היעדר שגיאות.
              ClinicFlow אינה מתחייבת שהתוכנה תפעל ללא הפרעה או שכל הפיצ'רים יהיו זמינים בכל עת.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. מגבלת אחריות כספית</h2>
            <p className="text-[#4a5568] leading-relaxed">
              בכל מקרה, האחריות הכוללת של ClinicFlow כלפי המשתמש לא תעלה על הסכום ששולם לרכישת הרישיון.
              ClinicFlow לא תישא בנזקים עקיפים, מיוחדים, תוצאתיים, או עונשיים, גם אם הוזהרה מאפשרות נזקים כאלו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. יצירת קשר</h2>
            <p className="text-[#4a5568] leading-relaxed">
              לשאלות: <a href="mailto:contact@clinic-flow.co.il" className="text-[#0d47a1] hover:underline">contact@clinic-flow.co.il</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
