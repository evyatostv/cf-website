import { Zap, WifiOff, ShieldCheck, Database, Check, X } from "lucide-react";

export function OfflineBenefits() {
  const benefits = [
    {
      icon: Zap,
      title: "מהירות תגובה מיידית",
      description: "כרטיס מטופל נפתח מיד, ללא גלגלי טעינה וללא עיכובים של עומסי שרת.",
    },
    {
      icon: WifiOff,
      title: "חסינות מלאה לנפילות רשת",
      description: "האינטרנט נפל במרפאה? העבודה לא נעצרת לשנייה אחת. כל התיקים, התורים והמסמכים זמינים כרגיל.",
    },
    {
      icon: ShieldCheck,
      title: "אפס חשיפה לרשת החיצונית",
      description: "אין שרת בענן שחשוף להתקפות כופר או פריצות סייבר מרחוק. המידע שמור רק אצלכם.",
    },
    {
      icon: Database,
      title: "עצמאות ושליטה מלאה",
      description: "הנתונים שייכים לכם. אין חברת תוכנה שיכולה לחסום לכם את הגישה לתיקי המטופלים.",
    },
  ];

  return (
    <section id="offline" className="py-20 sm:py-28 bg-[#0d47a1] text-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-xs sm:text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>עבודה מקומית ללא תלות</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              הענן נשמע מודרני —
              <br />
              <span className="text-[#93c5fd]">עד שהאינטרנט נופל באמצע יום טיפולים</span>
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-10 leading-relaxed">
              כשמטופל יושב מולך בחדר, אי אפשר לחכות שהענן ייטען. ClinicFlow פועלת מקומית על המחשב שלך — עובדת תמיד, מהר ובשקט.
            </p>

            <div className="space-y-6">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                    <b.icon className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{b.title}</h3>
                    <p className="text-sm text-white/75 leading-relaxed">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Real Practical Comparison Card */}
          <div className="bg-white text-[#0f172a] rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
            <h3 className="text-xl font-bold text-center mb-6 text-[#0f172a] pb-4 border-b border-[#e2e8f0]">
              השוואה מעשית: ענן מול ClinicFlow
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm pb-2 border-b border-[#f1f5f9] font-bold text-[#64748b]">
                <div>תוכנות ענן רגילות</div>
                <div className="text-[#0d47a1]">ClinicFlow אופליין</div>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-3 py-2 border-b border-[#f1f5f9] text-xs sm:text-sm">
                <div className="flex items-start gap-1.5 text-[#64748b]">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>מנוי חודשי שנמשך לנצח ומתייקר עם הזמן</span>
                </div>
                <div className="flex items-start gap-1.5 text-[#0f172a] font-medium">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>תשלום חד־פעמי קבוע (1,499 ₪) ללא מנוי</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-3 py-2 border-b border-[#f1f5f9] text-xs sm:text-sm">
                <div className="flex items-start gap-1.5 text-[#64748b]">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>נפילת אינטרנט = השבתה מלאה של המרפאה</span>
                </div>
                <div className="flex items-start gap-1.5 text-[#0f172a] font-medium">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>עבודה שוטפת 100% מהזמן גם ללא אינטרנט</span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-3 py-2 border-b border-[#f1f5f9] text-xs sm:text-sm">
                <div className="flex items-start gap-1.5 text-[#64748b]">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>רשומות רפואיות מאוחסנות בשרת צד שלישי</span>
                </div>
                <div className="flex items-start gap-1.5 text-[#0f172a] font-medium">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>נתונים מוצפנים על המחשב שלך בלבד (תיקון 13)</span>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-3 py-2 text-xs sm:text-sm">
                <div className="flex items-start gap-1.5 text-[#64748b]">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>עיכובי טעינה של דפדפן ותלות בספק</span>
                </div>
                <div className="flex items-start gap-1.5 text-[#0f172a] font-medium">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>תוכנת שולחן עבודה מהירה ומיידית</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e2e8f0] text-center">
              <a
                href="#lead-form"
                className="inline-block w-full py-3 bg-[#0d47a1] hover:bg-[#0a3880] text-white text-sm font-semibold rounded-xl transition-colors text-center"
              >
                רוצים לראות איך זה עובד? השאירו פרטים
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
