import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Zap, Wifi, Shield, HardDrive } from "lucide-react";

const Benefit = ({ icon: Icon, title, description, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-5"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#0d47a1]" />
      </div>
      <div>
        <h4 className="text-xl font-semibold text-white mb-2">{title}</h4>
        <p className="text-[#b8d4e6] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

export function OfflineBenefits() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const benefits = [
    {
      icon: Zap,
      title: "ביצועים מהירים",
      description: "עבודה מהירה ללא תלות ברשת. אין עיכובים, אין המתנות לטעינת נתונים.",
    },
    {
      icon: Wifi,
      title: "עבודה בכל מקום",
      description: "המערכת פועלת גם במקומות ללא אינטרנט. בקליניקה, בבית, בשטח - תמיד זמין.",
    },
    {
      icon: Shield,
      title: "אבטחה מוחלטת",
      description: "אפס סיכון לפריצות סייבר, גניבת מידע או דליפות נתונים דרך הרשת.",
    },
    {
      icon: HardDrive,
      title: "שליטה מלאה",
      description: "הנתונים שלך נשארים אצלך. אין תלות בחברות ענן או שירותים חיצוניים.",
    },
  ];

  return (
    <section className="py-32 bg-gradient-to-br from-[#0d47a1] via-[#0d47a1] to-[#00838f] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">למה אופליין?</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                היתרונות של
                <br />
                <span className="text-[#b8d4e6]">עבודה אופליין</span>
              </h2>
              <p className="text-xl text-[#b8d4e6] mb-12 leading-relaxed">
                בעידן בו הכל מחובר לאינטרנט, אנחנו מאמינים שנתונים רפואיים
                צריכים להישאר פרטיים ומאובטחים לחלוטין.
              </p>
            </motion.div>

            <div className="space-y-8">
              {benefits.map((benefit, index) => (
                <Benefit key={index} {...benefit} delay={index * 0.1} />
              ))}
            </div>
          </div>

          {/* Right side - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* Computer Icon */}
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#0d47a1] to-[#00838f] flex items-center justify-center shadow-xl">
                        <HardDrive className="w-16 h-16 text-white" />
                      </div>
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 rounded-3xl bg-[#0d47a1]/30"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#1a2332] mb-2">המחשב שלך = הבית של הנתונים</h3>
                    <p className="text-[#6b7c93]">כל המידע מאוחסן באופן מקומי ומאובטח</p>
                  </div>

                  {/* Status indicators */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f5f7f9] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm font-medium text-[#1a2332]">אינטרנט</span>
                      </div>
                      <p className="text-xs text-[#6b7c93]">לא מחובר</p>
                    </div>
                    <div className="bg-[#f5f7f9] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-[#1a2332]">המערכת</span>
                      </div>
                      <p className="text-xs text-[#6b7c93]">פעילה</p>
                    </div>
                  </div>

                  {/* Data visualization */}
                  <div className="bg-gradient-to-r from-[#e8f4f8] to-[#f0f4f7] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-[#1a2332]">אחסון מקומי</span>
                      <span className="text-sm font-bold text-[#0d47a1]">100%</span>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: "100%" } : { width: 0 }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#0d47a1] to-[#00838f] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
