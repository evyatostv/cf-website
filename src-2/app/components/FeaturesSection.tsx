import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Link } from "react-router";
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
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#e8f4f8] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
      title: "חוות דעת רפואיות",
      description: "יצירה וניהול חוות דעת מקצועיות, כולל חתימה דיגיטלית וייצוא ל-PDF.",
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
      title: "גיבוי ושחזור",
      description: "גיבוי של הנתונים במחשב שלך למניעת אובדן מידע.",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-32 bg-gradient-to-b from-white to-[#f5f7f9] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-7xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-[#e8f4f8] rounded-full px-5 py-2 mb-6">
            <BarChart3 className="w-4 h-4 text-[#0d47a1]" />
            <span className="text-sm font-medium text-[#0d47a1]">יכולות המערכת</span>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#1a2332] mb-6 leading-tight">
            כל מה שצריך
            <br />
            <span className="text-[#0d47a1]">
              במקום אחד
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-[#6b7c93] max-w-2xl mx-auto leading-relaxed">
            ניהול מטופלים, תורים, מסמכים וחשבוניות — במקום אחד, על המחשב שלכם, בלי מנוי חודשי.
          </p>
        </motion.div>

        <p className="text-sm text-[#475569] text-center mb-10 bg-[#f1f5f9] rounded-xl px-6 py-3 max-w-2xl mx-auto border border-[#cbd5e1]">
          * כל היכולות כלולות במלואן ברישיון ClinicFlow לצמיתות (1,499 ₪) — ללא פיצול לחבילות, ללא עלויות חודשיות וללא תשלומים נוספים.{" "}
          <Link to="/pricing" className="text-[#0d47a1] font-semibold hover:underline">ראו פרטי תמחור מלאים.</Link>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {features.map((feature, index) => (
            <Feature key={index} {...feature} delay={0} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 bg-white rounded-2xl p-6 sm:p-8 border border-[#cbd5e1] shadow-md text-right">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-1">רוצים לראות איך זה מתאים לקליניקה שלכם?</h3>
              <p className="text-sm sm:text-base text-[#64748b]">נשמח להציג לכם הדגמה אישית קצרה וממוקדת — ללא התחייבות.</p>
            </div>
            <a href="#lead-form" className="flex-shrink-0">
              <button
                type="button"
                className="px-8 py-3.5 bg-[#0d47a1] hover:bg-[#0a3880] text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap cursor-pointer"
              >
                תיאום הדגמה מהירה
              </button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
