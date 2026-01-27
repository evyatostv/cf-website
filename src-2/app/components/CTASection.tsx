import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const checkmarks = [
    "התקנה פשוטה ומהירה",
    "אין צורך באינטרנט",
    "תמיכה טכנית מלאה",
    "ללא עלויות חודשיות",
  ];

  return (
    <section className="py-32 bg-gradient-to-b from-[#f8fafb] to-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-br from-[#0d47a1] to-[#00838f] rounded-[2.5rem] p-12 md:p-16 overflow-hidden shadow-2xl"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              מוכן להתחיל?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl md:text-2xl text-[#b8d4e6] mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              הצטרף לאלפי רופאים שבחרו באבטחה ובפרטיות מוחלטת
            </motion.p>

            {/* Checkmarks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10"
            >
              {checkmarks.map((item, index) => (
                <div key={index} className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#b8d4e6] flex-shrink-0" />
                  <span className="text-white">{item}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-10 py-5 bg-white text-[#0d47a1] rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 text-lg flex items-center gap-2"
                >
                  <span>התחל ניסיון חינם</span>
                  <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
                </motion.button>
              </Link>

              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-2xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 text-lg font-medium"
                >
                  דבר עם מומחה
                </motion.button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-sm text-[#b8d4e6] mt-8"
            >
              ללא כרטיס אשראי • התקנה מיידית • ביטול בכל עת
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
