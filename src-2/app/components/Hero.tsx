import { motion } from "motion/react";
import { ShieldCheck, WifiOff, Database, CheckCircle2, ArrowLeft } from "lucide-react";

export function Hero() {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] border-b border-[#e2e8f0]">
      <div className="relative z-10 container mx-auto px-6 max-w-5xl py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 border border-[#cbd5e1] rounded-full px-4 py-1.5 shadow-xs mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-[#1e293b]">
              רישיון לצמיתות • 100% אופליין ומקומי • תואם תיקון 13
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#0f172a] leading-[1.12] tracking-tight mb-6">
            פחות ניירת.
            <br />
            <span className="text-[#0d47a1]">יותר רפואה.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-2xl text-[#475569] mb-6 max-w-2xl mx-auto leading-relaxed">
            תוכנה לניהול קליניקה שרצה ישירות על המחשב שלך — ללא שרתי ענן, ללא תלות באינטרנט, וללא מנוי חודשי שמתייקר.
          </p>

          <p className="text-sm sm:text-base text-[#64748b] mb-10 font-medium">
            מותאם לרופאים פרטיים, פסיכולוגים, פיזיותרפיסטים, קלינאי תקשורת ומטפלים עצמאיים
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 max-w-md mx-auto">
            <a href="#lead-form" className="w-full sm:w-auto flex-1">
              <button
                type="button"
                className="w-full px-8 py-4 bg-[#0d47a1] hover:bg-[#0a3880] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>השאירו פרטים להדגמה</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </a>

            <a href="#features" className="w-full sm:w-auto flex-1">
              <button
                type="button"
                className="w-full px-8 py-4 bg-white text-[#1e293b] rounded-xl border border-[#cbd5e1] hover:border-[#0d47a1] hover:bg-[#f8fafc] transition-all text-base sm:text-lg font-medium shadow-xs cursor-pointer"
              >
                גלו את היכולות
              </button>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-14 pt-8 border-t border-[#e2e8f0]/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-right">
            <div className="flex items-center gap-2.5 text-[#334155]">
              <ShieldCheck className="w-5 h-5 text-[#0d47a1] flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">תואם תיקון 13</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#334155]">
              <WifiOff className="w-5 h-5 text-[#00838f] flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">עובד ללא אינטרנט</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#334155]">
              <Database className="w-5 h-5 text-[#0d47a1] flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">המידע על המחשב שלך</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#334155]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">30 יום החזר כספי</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
