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

const features: { icon: React.ElementType; title: string; description: string; plan: PlanTier }[] = [
  {
    icon: Users,
    title: "כרטיס מטופל מלא",
    plan: "basic",
    description: "פתחת ביקור — תוך שלוש שניות אתה רואה אלרגיות, טיפול קבוע, וסיכום הביקור הקודם. בלי לחפש, בלי לשאול, בלי לבזבז זמן.",
  },
  {
    icon: Calendar,
    title: "יומן תורים",
    plan: "basic",
    description: "תצוגה יומית, שבועית וחודשית. גרור תור לשעה חדשה — הוא זזה. תזכורות אוטומטיות לפני כל פגישה. פחות ביטולים ב-50%.",
  },
  {
    icon: FileText,
    title: "תיעוד ביקורים",
    plan: "basic",
    description: "שדות SOAP מסודרים לפי הסדר שאתה עובד בו. משפטים מוכנים שמקצרים את הכתיבה. מסמך PDF מוכן בשניות בסוף הביקור.",
  },
  {
    icon: BarChart3,
    title: "דוחות ומעקב",
    plan: "professional",
    description: "כמה ביקורים עשית החודש? כמה מסמכים? כמה שעות עבדת? הנתונים מחכים לך — בגרף, לא בטבלת אקסל שאתה צריך לבנות לבד.",
  },
  {
    icon: Receipt,
    title: "קבלות וחשבוניות",
    plan: "full",
    description: "גמרת ביקור? תוציא קבלה ישירות מהמסך — שם המטופל כבר שם. מעקב הכנסות לפי חודש ושנה. מה שהיה לוקח 10 דקות לוקח 30 שניות.",
  },
  {
    icon: FileText,
    title: "חוות דעת מקצועיות",
    plan: "premium",
    description: "חוות דעת מפורטות עם תבניות לכל סוג מסמך. עריכת סעיפים, חתימה, ייצוא PDF. בדיוק מה שביטוח ותביעות צריכים לראות.",
  },
  {
    icon: Folder,
    title: "ארכיון מסמכים",
    plan: "basic",
    description: "כל המסמכים שהפקת נשמרים ומסודרים לפי מטופל ותאריך. חיפוש לפי מילה בתוך מסמך — מוצא ברגע.",
  },
  {
    icon: Clock,
    title: "גיבוי מוצפן",
    plan: "basic",
    description: "הגיבוי קורה לבד. אם המחשב שלך מתקלקל, תוך דקות תחזור לעבוד — בלי שתאבד שום דבר. הצפנה עם סיסמה שרק אתה יודע.",
  },
  {
    icon: Shield,
    title: "נעילה אוטומטית",
    plan: "basic",
    description: "המסך מתעמעם כשאתה עוזב את החדר. PIN לפתיחה. אף אחד לא רואה נתוני מטופלים בלי רשותך — גם לא עם גישה פיזית למחשב.",
  },
  {
    icon: Database,
    title: "נתונים אצלך בלבד",
    plan: "basic",
    description: "אין שרת, אין ענן, אין גיבוי לשרת חיצוני. הכל על הדיסק שלך. מתקפת סייבר על שרת חיצוני? לא הבעיה שלך.",
  },
  {
    icon: Lock,
    title: "פרטיות מוחלטת",
    plan: "basic",
    description: "אין לנו גישה לנתוני המטופלים שלך. אנחנו פשוט לא יכולים לראות אותם — גם אם נרצה. המידע הרפואי נשאר בינך לבין המטופל.",
  },
  {
    icon: WifiOff,
    title: "עובד בלי אינטרנט",
    plan: "basic",
    description: "האינטרנט נפל? ClinicFlow לא יודע מזה. כל הביקורים, המסמכים, והיומן ממשיכים לעבוד כרגיל.",
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
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#1a2332] mb-6">
            הכלים שרופאים פרטיים
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              באמת צריכים
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto">
            ללא עודף. ללא בירוקרטיה. בדיוק מה שמרפאה פרטית צריכה — לא יותר ולא פחות.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => {
            const isLocked = feature.plan !== "basic";
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-white rounded-3xl p-5 sm:p-8 border border-[#e1e6ec] flex flex-col hover:border-[#0d47a1]/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d47a1]/10 to-[#00838f]/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-[#0d47a1]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1a2332] mb-3">{feature.title}</h3>
                <p className="text-[#6b7c93] leading-relaxed flex-grow">{feature.description}</p>
                {isLocked && feature.plan !== "premium" && (
                  <Link
                    to="/pricing"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0d47a1] hover:text-[#00838f] transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    זמין בחבילות מתקדמות
                  </Link>
                )}
                {isLocked && feature.plan === "premium" && (
                  <Link
                    to="/contact"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0d47a1] hover:text-[#00838f] transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    צרו קשר לפרטים
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
