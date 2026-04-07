import { motion } from "motion/react";
import {
  Users,
  Calendar,
  FileText,
  Receipt,
  BarChart3,
  Folder,
  Clock,
  Shield,
  Database,
  Lock,
  WifiOff,
  ArrowUpCircle,
} from "lucide-react";
import { Link } from "react-router";

type PlanTier = "basic" | "professional" | "full" | "premium";

const PLAN_BADGE: Record<PlanTier, { label: string; color: string }> = {
  basic:        { label: "כל החבילות",   color: "bg-[#e8f4f8] text-[#0d47a1]" },
  professional: { label: "מקצועית+",      color: "bg-purple-50 text-purple-700" },
  full:         { label: "ניהול מלאה+",   color: "bg-orange-50 text-orange-700" },
  premium:      { label: "פרימיום",        color: "bg-yellow-50 text-yellow-700" },
};

const features: { icon: React.ElementType; title: string; description: string; plan: PlanTier }[] = [
  {
    icon: Users,
    title: "ניהול מטופלים מתקדם",
    plan: "basic",
    description: "כרטיס מטופל דיגיטלי מלא עם היסטוריה רפואית מפורטת, אנמנזה, רשימת אלרגיות ומידע משפחתי. חיפוש מהיר וגישה לכל המידע במקום אחד.",
  },
  {
    icon: Calendar,
    title: "יומן תורים חכם",
    plan: "basic",
    description: "ניהול תורים אינטואיטיבי עם תצוגה יומית, שבועית וחודשית. הגדרת תזכורות אוטומטיות, חסימת שעות, וניהול רשימת המתנה. ממשק גרירה ושחרור לתזמון קל.",
  },
  {
    icon: FileText,
    title: "תיעוד רפואי מלא",
    plan: "basic",
    description: "רשומות רפואיות מפורטות עם תיעוד ביקורים, אבחנות, תוצאות בדיקות מעבדה, והפניות. תבניות מותאמות אישית לכל סוג טיפול. צירוף קבצים ותמונות.",
  },
  {
    icon: BarChart3,
    title: "דוחות וניתוחים",
    plan: "professional",
    description: "דוחות סטטיסטיים מקיפים על פעילות הקליניקה. ניתוח מגמות, גרפים אינטראקטיביים, דוחות מותאמים אישית. ייצוא לאקסל ו-PDF.",
  },
  {
    icon: Receipt,
    title: "ניהול כספי וחשבוניות",
    plan: "full",
    description: "יצירה אוטומטית של חשבוניות וקבלות. ניהול תשלומים, מעקב אחר חובות, דוחות הכנסות והוצאות. התאמה לדרישות מס הכנסה.",
  },
  {
    icon: FileText,
    title: "חוות דעת מקצועיות",
    plan: "premium",
    description: "יצירה וניהול חוות דעת רפואיות מפורטות עם תבניות מותאמות אישית. חתימה דיגיטלית, ייצוא ל-PDF והדפסה. ניהול ארכיון חוות הדעת לפי מטופל.",
  },
  {
    icon: Folder,
    title: "ארכיון דיגיטלי",
    plan: "basic",
    description: "ארגון אוטומטי של כל המסמכים והקבצים. חיפוש מהיר לפי תאריכים, סוגי טיפול או מטופלים. גיבוי אוטומטי של כל המידע.",
  },
  {
    icon: Clock,
    title: "גיבויים אוטומטיים",
    plan: "basic",
    description: "גיבוי אוטומטי של כל המידע במחשב שלך. שחזור מהיר במקרה של צורך. אין תלות בשירותי ענן חיצוניים.",
  },
  {
    icon: Shield,
    title: "אבטחה מתקדמת",
    plan: "basic",
    description: "הצפנה מלאה של כל הנתונים במחשב. הגנה בסיסמה, ניהול הרשאות משתמשים. עמידה בתקנים הרפואיים הגבוהים ביותר.",
  },
  {
    icon: Database,
    title: "אחסון מקומי",
    plan: "basic",
    description: "כל המידע נשמר רק במחשב שלך. אין העברת נתונים לשרתים חיצוניים. שליטה מלאה על המידע הרפואי.",
  },
  {
    icon: Lock,
    title: "פרטיות מוחלטת",
    plan: "basic",
    description: "אפס גישה לגורמים חיצוניים. אין שיתוף מידע עם צדדים שלישיים. המידע נשאר אצלך בלבד.",
  },
  {
    icon: WifiOff,
    title: "עבודה אופליין",
    plan: "basic",
    description: "פועל ללא חיבור לאינטרנט. מהיר ויציב תמיד. אידיאלי לקליניקות ללא חיבור אמין.",
  },
];

export function FeaturesPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6">
            כל מה שצריך
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              לניהול מושלם
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto">
            מערכת מקיפה המשלבת את כל הכלים הנחוצים לניהול יעיל של קליניקה רפואית
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const badge = PLAN_BADGE[feature.plan];
            const isLocked = feature.plan !== "basic";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`bg-white rounded-3xl p-8 border flex flex-col transition-all duration-300 ${
                  isLocked
                    ? "border-[#e1e6ec] hover:border-[#0d47a1]/30 hover:shadow-xl"
                    : "border-[#e1e6ec] hover:border-[#0d47a1]/30 hover:shadow-xl"
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-[#0d47a1]" />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-[#1a2332] mb-3">{feature.title}</h3>
                <p className="text-[#6b7c93] leading-relaxed flex-grow">{feature.description}</p>
                {isLocked && feature.plan !== "premium" && (
                  <Link
                    to="/pricing"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0d47a1] hover:text-[#00838f] transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    שדרג לחבילת {badge.label}
                  </Link>
                )}
                {isLocked && feature.plan === "premium" && (
                  <Link
                    to="/contact"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0d47a1] hover:text-[#00838f] transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    צרו קשר לפרטים על {badge.label}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
