import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  FileText,
  Calendar,
  BarChart3,
  Clock,
  Users,
  Pill,
  Receipt,
  Folder,
} from "lucide-react";

const Feature = ({ icon: Icon, title, description, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay }}
      className="group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-[#0d47a1]" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[#1a2332] mb-2">{title}</h3>
          <p className="text-[#6b7c93] leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Users,
      title: "ניהול מטופלים",
      description: "כרטיס מטופל מלא עם היסטוריה רפואית, אנמנזה, ותיעוד מפורט.",
    },
    {
      icon: Calendar,
      title: "יומן תורים",
      description: "ניהול תורים חכם עם תזכורות, ממשק קל לתזמון וצפייה יומית/שבועית.",
    },
    {
      icon: FileText,
      title: "תיעוד רפואי",
      description: "רשומות רפואיות מלאות, אבחנות, תוצאות בדיקות ומעקב אחר טיפולים.",
    },
    {
      icon: Pill,
      title: "ניהול תרופות",
      description: "מעקב אחר מרשמים, אינטראקציות בין תרופות ובדיקת אלרגיות.",
    },
    {
      icon: Receipt,
      title: "חשבוניות וקבלות",
      description: "יצירה אוטומטית של חשבוניות, קבלות וניהול כספי מלא.",
    },
    {
      icon: BarChart3,
      title: "דוחות וסטטיסטיקות",
      description: "ניתוח נתונים מתקדם, דוחות מפורטים וגרפים להמחשה ויזואלית.",
    },
    {
      icon: Folder,
      title: "ארכיון מסודר",
      description: "ארגון וחיפוש מהיר של כל המידע הרפואי והמסמכים.",
    },
    {
      icon: Clock,
      title: "גיבויים אוטומטיים",
      description: "גיבוי אוטומטי של הנתונים במחשב שלך למניעת אובדן מידע.",
    },
  ];

  return (
    <section className="py-32 bg-gradient-to-b from-white to-[#f8fafb] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-[#e8f4f8] rounded-full px-5 py-2 mb-6">
            <BarChart3 className="w-4 h-4 text-[#0d47a1]" />
            <span className="text-sm font-medium text-[#0d47a1]">יכולות המערכת</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6 leading-tight">
            כל מה שרופא
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              צריך במקום אחד
            </span>
          </h2>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto leading-relaxed">
            מערכת מקיפה לניהול כל היבטי העבודה הרפואית. פשוט, יעיל ומאובטח.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {features.map((feature, index) => (
            <Feature key={index} {...feature} delay={index * 0.05} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white rounded-3xl p-8 border border-[#e1e6ec] shadow-lg">
            <div className="text-right">
              <h3 className="text-2xl font-semibold text-[#1a2332] mb-2">מעוניין לראות יותר?</h3>
              <p className="text-[#6b7c93]">קבע דמו אישי וגלה את כל היכולות</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow whitespace-nowrap"
            >
              קבע פגישה
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
