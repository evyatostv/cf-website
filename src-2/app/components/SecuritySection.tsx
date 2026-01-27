import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Lock, Database, ShieldOff, Eye } from "lucide-react";

const SecurityFeature = ({ icon: Icon, title, description, delay }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-white rounded-3xl p-8 border border-[#e1e6ec] hover:border-[#0d47a1]/30 hover:shadow-xl hover:shadow-[#0d47a1]/5 transition-all duration-300"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-[#0d47a1]" />
        </div>
        <h3 className="text-2xl font-semibold text-[#1a2332] mb-3">{title}</h3>
        <p className="text-[#6b7c93] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

export function SecuritySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: Lock,
      title: "אין חיבור לאינטרנט",
      description: "המערכת פועלת במצב אופליין מוחלט. אין חיבור לשרתים חיצוניים או ענן.",
    },
    {
      icon: Database,
      title: "אחסון מקומי בלבד",
      description: "כל הנתונים נשמרים רק במחשב שלך. אף גורם חיצוני לא יכול לגשת אליהם.",
    },
    {
      icon: ShieldOff,
      title: "אפס העברת מידע",
      description: "המערכת לא שולחת ולא מקבלת נתונים. פרטיות מוחלטת של המטופלים.",
    },
    {
      icon: Eye,
      title: "שליטה מלאה",
      description: "אתה הבעלים היחיד של המידע. אין גיבויים בענן או העתקים חיצוניים.",
    },
  ];

  return (
    <section className="py-32 bg-gradient-to-b from-[#f0f4f7] to-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#e1e6ec] to-transparent" />

      <div className="container mx-auto px-6 max-w-7xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-[#e8f4f8] rounded-full px-5 py-2 mb-6">
            <Lock className="w-4 h-4 text-[#0d47a1]" />
            <span className="text-sm font-medium text-[#0d47a1]">אבטחה ופרטיות</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6 leading-tight">
            הנתונים שלך
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              נשארים אצלך
            </span>
          </h2>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto leading-relaxed">
            מערכת ניהול חולים שמבטיחה פרטיות מוחלטת. ללא חיבור לאינטרנט,
            ללא העברת נתונים, ללא סיכונים.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <SecurityFeature key={index} {...feature} delay={index * 0.1} />
          ))}
        </div>

        {/* Visual Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 bg-white rounded-3xl p-12 border border-[#e1e6ec] shadow-lg"
        >
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0d47a1] to-[#00838f] flex items-center justify-center mb-4 mx-auto shadow-lg">
                <Database className="w-12 h-12 text-white" />
              </div>
              <p className="text-lg font-semibold text-[#1a2332]">המחשב שלך</p>
              <p className="text-sm text-[#6b7c93] mt-1">כל הנתונים כאן</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-32 h-1 bg-gradient-to-r from-[#e1e6ec] via-[#e1e6ec] to-[#e1e6ec] relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldOff className="w-8 h-8 text-[#00838f] bg-white px-2" />
                </div>
              </div>
              <p className="text-xs text-[#6b7c93] mt-2 font-medium">אין חיבור</p>
            </div>

            <div className="text-center opacity-40">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#e1e6ec] flex items-center justify-center mb-4 mx-auto">
                <Eye className="w-12 h-12 text-[#6b7c93]" />
              </div>
              <p className="text-lg font-semibold text-[#6b7c93]">אינטרנט</p>
              <p className="text-sm text-[#6b7c93] mt-1">לא פעיל</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
