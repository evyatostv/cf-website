import { motion } from "motion/react";
import { ShieldCheck, WifiOff } from "lucide-react";

export function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-[#f8fafb] to-[#f5f7f9]">
      <div className="relative z-10 container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center pt-12 sm:pt-20"
        >
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 sm:mt-8 mb-2"
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-[#1a2332] leading-[1.1] tracking-tight mb-2 sm:mb-4 px-2">
              פחות ניירת. יותר זמן למטופלים.
            </h1>

            <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#0d47a1] mt-4 sm:mt-8">
              ניהול המרפאה הפרטית במקום אחד
            </p>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base sm:text-lg md:text-2xl text-[#6b7c93] mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2"
          >
            תיקי מטופלים, יומן תורים, תיעוד ביקורים, מסמכים וניהול כספי — במערכת פשוטה שנבנתה לרופא העצמאי.
            <br />
            1,499 ₪ בתשלום חד פעמי. הנתונים נשארים אצלך, והמחשב ממשיך לעבוד גם בלי אינטרנט.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4"
          >
            <a href="#lead-form">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-2xl shadow-lg shadow-[#0d47a1]/20 hover:shadow-xl hover:shadow-[#0d47a1]/30 transition-all duration-300 text-lg font-medium"
              >
                <span className="relative z-10">לקבלת הדגמה קצרה</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0a3a85] to-[#006d77] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </a>

            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-10 py-5 bg-white text-[#1a2332] rounded-2xl border-2 border-[#e1e6ec] hover:border-[#0d47a1] hover:bg-[#f8fafb] transition-all duration-300 text-lg font-medium shadow-sm"
              >
                גלו עוד
              </motion.button>
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-10 sm:mt-16 flex items-center justify-center gap-4 sm:gap-8 flex-wrap"
          >
            <div className="flex items-center gap-2 text-[#6b7c93]">
              <ShieldCheck className="w-5 h-5 text-[#00838f]" />
              <span className="text-sm">אבטחה ברמה רפואית</span>
            </div>
            <div className="flex items-center gap-2 text-[#6b7c93]">
              <WifiOff className="w-5 h-5 text-[#00838f]" />
              <span className="text-sm">עובד ללא אינטרנט</span>
            </div>
            <div className="flex items-center gap-2 text-[#6b7c93]">
              <div className="w-5 h-5 rounded-full bg-[#0d47a1]" />
              <span className="text-sm">נתונים אצלך בלבד</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
