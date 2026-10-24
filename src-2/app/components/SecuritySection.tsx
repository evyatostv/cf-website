import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Lock, HardDrive, ShieldCheck, KeyRound, ServerOff, FileCheck } from "lucide-react";

const SecurityFeature = ({ icon: Icon, title, description }: any) => {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs hover:border-[#0d47a1]/40 hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-[#0d47a1]" />
      </div>
      <h3 className="text-xl font-bold text-[#0f172a] mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-[#64748b] leading-relaxed">{description}</p>
    </div>
  );
};

export function SecuritySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: HardDrive,
      title: "נתוני מטופלים מקומיים בלבד",
      description: "כל הרשומות הרפואיות, סיכומי הביקור והתורים נשמרים ישירות על המחשב שלך בלבד. שום גורם חיצוני אינו יכול לגשת אליהם.",
    },
    {
      icon: ServerOff,
      title: "אפס שרתי ענן לרשומות רפואיות",
      description: "אין שרת מרכזי שיכול להיפרץ או לדלוף. מידע רפואי רגיש לא מועבר לשום ענן צד שלישי.",
    },
    {
      icon: KeyRound,
      title: "הצפנה מקומית וגיבוי בסיסמה",
      description: "מסד נתונים מוצפן ואפשרות לגיבוי מלא לקובץ מוצפן בסיסמה — לשמירה על דיסק חיצוני או התקן USB.",
    },
    {
      icon: ShieldCheck,
      title: "עמידה בדרישות תיקון 13",
      description: "מבנה המערכת נבנה בהתאם לחוק הגנת הפרטיות הישראלי (תיקון 13) — שליטה מלאה ואחריות בלעדית של בעל המרפאה על מאגר המידע.",
    },
  ];

  return (
    <section id="security" className="py-20 sm:py-28 bg-[#f8fafc] border-b border-[#e2e8f0] relative" ref={ref}>
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-[#e0f2fe] text-[#0369a1] text-xs sm:text-sm font-semibold rounded-full px-4 py-1.5 mb-4">
            <Lock className="w-4 h-4 text-[#0284c7]" />
            <span>פרטיות ואבטחת מידע</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#0f172a] leading-tight mb-4">
            הנתונים הרפואיים של המטופלים
            <br />
            <span className="text-[#0d47a1]">נשארים במרפאה שלך</span>
          </h2>
          <p className="text-base sm:text-lg text-[#64748b] leading-relaxed">
            בניגוד למערכות ענן שמרכזות מיליוני תיקים רפואיים ביעד תקיפה אחד — ב-ClinicFlow כל קליניקה היא מבצר עצמאי.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <SecurityFeature key={index} {...feature} />
          ))}
        </div>

        {/* Professional Compliance Guarantee Card */}
        <div className="mt-12 bg-white rounded-2xl p-6 sm:p-10 border border-[#cbd5e1] shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-right">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0f172a]">
                  תאימות מלאה לחוק הגנת הפרטיות (תיקון 13)
                </h3>
                <p className="text-sm text-[#64748b] mt-1">
                  המידע הרפואי אינו עובר עיבוד או אחסון בשרתי צד שלישי — אתם הבעלים הבלעדיים של מאגר המידע.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>ללא תלות באינטרנט • ללא שרתי ביניים</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
