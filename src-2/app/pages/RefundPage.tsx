export function RefundPage() {
  return (
    <div className="pt-32 pb-20 min-h-screen" dir="rtl">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-[#1a2332] mb-2">מדיניות החזרים</h1>
        <p className="text-sm text-[#6b7c93] mb-10">עדכון אחרון: אפריל 2026 | גרסת מדיניות: 1.0</p>

        <div className="space-y-10 text-[#1a2332]">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. כלל כללי — אין החזרים על תוכנה דיגיטלית</h2>
            <p className="text-[#4a5568] leading-relaxed">
              רישיון תוכנה דיגיטלי אינו ניתן להחזרה לאחר הפעלתו, בהתאם לחוק הגנת הצרכן הישראלי (סעיף 14ג(ד)(2) — פטור ממוצרים דיגיטליים).
              בעצם הרכישה, המשתמש מסכים שהוא מבין ומקבל מדיניות זו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. חריגים — מתי ייתכן החזר</h2>
            <p className="text-[#4a5568] leading-relaxed mb-3">
              החזר כספי מלא עשוי להינתן, לפי שיקול דעת החברה, אם:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#4a5568]">
              <li>התוכנה נכשלת בהתקנה או בהפעלה הבסיסית במערכת הפעלה נתמכת</li>
              <li>הבקשה הוגשה תוך 7 ימי עסקים מיום הרכישה</li>
              <li>המשתמש יצר קשר עם התמיכה לפני הגשת הבקשה ונעשה ניסיון לפתרון הבעיה</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. אין החזר במקרים הבאים</h2>
            <ul className="list-disc list-inside space-y-2 text-[#4a5568]">
              <li>שינוי דעה לאחר הרכישה</li>
              <li>רכישת חבילה שגויה (ניתן לשדרג בתשלום ההפרש)</li>
              <li>חוסר תאימות עם חומרה שאינה עומדת בדרישות המינימום</li>
              <li>אי-שימוש בתוכנה לאחר הרכישה</li>
              <li>לאחר יותר מ-7 ימים מהרכישה</li>
              <li>לאחר פתיחת chargeback ללא פנייה מוקדמת לתמיכה</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. תהליך הגשת בקשה</h2>
            <ol className="list-decimal list-inside space-y-2 text-[#4a5568]">
              <li>שלח דוא״ל אל <a href="mailto:contact@clinic-flow.co.il" className="text-[#0d47a1] hover:underline">contact@clinic-flow.co.il</a> עם נושא: "בקשת החזר — [מספר הזמנה]"</li>
              <li>פרט את הבעיה שנתקלת בה ומה ניסית לפתור</li>
              <li>צרף צילום מסך של השגיאה (אם רלוונטי)</li>
              <li>קבלת אישור בדוא״ל תוך 48 שעות עסקים</li>
              <li>אם הבקשה אושרה — ההחזר יועבר תוך 14 ימי עסקים לכרטיס שבו שולם</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Chargeback</h2>
            <p className="text-[#4a5568] leading-relaxed">
              פתיחת chargeback ללא פנייה מוקדמת לתמיכה תגרום לביטול מיידי של הרישיון.
              אנא פנה אלינו תחילה — אנחנו נשתדל לפתור כל בעיה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. יצירת קשר</h2>
            <p className="text-[#4a5568] leading-relaxed">
              לכל שאלה: <a href="mailto:contact@clinic-flow.co.il" className="text-[#0d47a1] hover:underline">contact@clinic-flow.co.il</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
