import { motion } from "motion/react";
import { ShieldCheck, WifiOff } from "lucide-react";
import { Link } from "react-router";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-[#f8fafb] to-[#f0f4f7]">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#0d47a1]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-[#00838f]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-[#e1e6ec] rounded-full px-5 py-2.5 mb-8 shadow-sm"
          >
            <WifiOff className="w-4 h-4 text-[#00838f]" />
            <span className="text-sm text-[#1a2332]">מערכת אופליין מלאה</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#1a2332] mb-6 leading-[1.1] tracking-tight"
          >
            מערכת ניהול חולים
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              ללא אינטרנט
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-[#6b7c93] mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            כל הנתונים שלך מאוחסנים אצלך במחשב. אפס סיכון להדלפות.
            <br />
            אבטחה מוחלטת. פרטיות מובטחת.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/contact">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-10 py-5 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-2xl shadow-lg shadow-[#0d47a1]/20 hover:shadow-xl hover:shadow-[#0d47a1]/30 transition-all duration-300 text-lg font-medium"
              >
                <span className="relative z-10">התחל עכשיו</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0a3a85] to-[#006d77] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </Link>

            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-5 bg-white text-[#1a2332] rounded-2xl border-2 border-[#e1e6ec] hover:border-[#0d47a1] hover:bg-[#f8fafb] transition-all duration-300 text-lg font-medium shadow-sm"
              >
                גלה עוד
              </motion.button>
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-16 flex items-center justify-center gap-8 flex-wrap"
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
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0d47a1] to-[#00838f]" />
              <span className="text-sm">נתונים אצלך בלבד</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
