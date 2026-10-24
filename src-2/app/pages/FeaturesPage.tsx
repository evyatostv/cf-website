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
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router";
import { Seo } from "@/app/components/Seo";

const features: { icon: React.ElementType; title: string; description: string }[] = [
  {
    icon: Users,
    title: "כרטיס מטופל מלא",
    description: "פתחת/ת ביקור — תוך שלוש שניות את/ה רואה אלרגיות, טיפול קבוע, וסיכום הביקור הקודם. בלי לחפש, בלי לשאול, בלי לבזבז זמן.",
  },
  {
    icon: Calendar,
    title: "יומן תורים",
    description: "תצוגה יומית, שבועית וחודשית. גרור/י תור לשעה חדשה — הוא זזה. תזכורות אוטומטיות לפני כל פגישה. פחות ביטולים ב-50%.",
  },
  {
    icon: FileText,
    title: "תיעוד ביקורים",
    description: "שדות SOAP מסודרים לפי הסדר שאת/ה עובד/ת בו. משפטים מוכנים שמקצרים את הכתיבה. מסמך PDF מוכן בשניות בסוף הביקור.",
  },
  {
    icon: BarChart3,
    title: "דוחות ומעקב",
    description: "כמה ביקורים עשית/ת החודש? כמה מסמכים? כמה שעות עבדת/ת? הנתונים מחכים לך — בגרף, לא בטבלת אקסל שאת/ה צריך/ה לבנות לבד.",
  },
  {
    icon: Receipt,
    title: "קבלות וחשבוניות",
    description: "גמרת/ת ביקור? תוציא/י קבלה ישירות מהמסך — שם המטופל כבר שם. מעקב הכנסות לפי חודש ושנה. מה שהיה לוקח 10 דקות לוקח 30 שניות.",
  },
  {
    icon: FileText,
    title: "חוות דעת מקצועיות",
    description: "חוות דעת מפורטות עם תבניות לכל סוג מסמך. עריכת סעיפים, חתימה, ייצוא PDF. בדיוק מה שביטוח ותביעות צריכים לראות.",
  },
  {
    icon: Folder,
    title: "ארכיון מסמכים",
    description: "כל המסמכים שהפקת נשמרים ומסודרים לפי מטופל ותאריך. חיפוש לפי מילה בתוך מסמך — מוצא ברגע.",
  },
  {
    icon: Clock,
    title: "גיבוי מוצפן",
    description: "הגיבוי קורה לבד. אם המחשב שלך מתקלקל, תוך דקות תחזור/י לעבוד — בלי שתאבד/י שום דבר. הצפנה עם סיסמה שרק את/ה יודע/ת.",
  },
  {
    icon: Shield,
    title: "נעילה אוטומטית",
    description: "המסך מתעמעם כשאת/ה עוזב/ת את החדר. PIN לפתיחה. אף אחד לא רואה נתוני מטופלים בלי רשותך — גם לא עם גישה פיזית למחשב.",
  },
  {
    icon: Database,
    title: "נתונים אצלך בלבד",
    description: "אין שרת, אין ענן, אין גיבוי לשרת חיצוני. הכל על הדיסק שלך. מתקפת סייבר על שרת חיצוני? לא הבעיה שלך.",
  },
  {
    icon: Lock,
    title: "פרטיות מוחלטת",
    description: "אין לנו גישה לנתוני המטופלים שלך. אנחנו פשוט לא יכולים לראות אותם — גם אם נרצה. המידע הרפואי נשאר בינך לבין המטופל.",
  },
  {
    icon: WifiOff,
    title: "עובד בלי אינטרנט",
    description: "האינטרנט נפל? ClinicFlow לא יודע מזה. כל הביקורים, המסמכים, והיומן ממשיכים לעבוד כרגיל.",
  },
];

const featuresItemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "היכולות המרכזיות של ClinicFlow — תוכנה לניהול קליניקה",
  numberOfItems: features.length,
  itemListElement: features.map((feature, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: feature.title,
  })),
};

export function FeaturesPage() {
  return (
    <div className="pt-32 pb-20">
      <Seo
        title="יכולות התוכנה לניהול קליניקה – תיק מטופל, יומן, חשבוניות | ClinicFlow"
        description="כל היכולות של ClinicFlow לניהול קליניקה: כרטיס מטופל מלא, יומן תורים, תיעוד ביקורים SOAP, קבלות וחשבוניות, דוחות וגיבוי מוצפן — הכל אופליין, בתשלום חד־פעמי."
        canonicalPath="/features"
        jsonLd={[featuresItemListJsonLd]}
      />
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
            <span className="text-[#0d47a1]">
              באמת צריכים
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto">
            ללא עודף. ללא בירוקרטיה. בדיוק מה שמרפאה פרטית צריכה — לא יותר ולא פחות.
          </p>
        </motion.div>

        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 mb-12 text-center max-w-2xl mx-auto">
          <p className="text-sm sm:text-base text-[#1e293b] font-medium">
            ✨ כל היכולות המוצגות מטה כלולות ברישיון המלא לצמיתות — ללא חבילות חסומות, ללא תוספת תשלום.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2e8f0] flex flex-col hover:border-[#0d47a1]/40 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#e8f4f8] flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-[#0d47a1]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-[#64748b] leading-relaxed flex-grow">{feature.description}</p>
              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>כלול ברישיון המלא</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center bg-white rounded-2xl p-8 sm:p-12 border border-[#cbd5e1] shadow-sm max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-3">
            רישיון אחד. כל הכלים. ללא מנוי.
          </h2>
          <p className="text-[#64748b] mb-8 text-base sm:text-lg">
            1,499 ₪ בתשלום חד־פעמי לכל החיים, עם 30 יום החזר כספי מלא.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#0d47a1] hover:bg-[#0a3880] text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>לרכישת רישיון</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#1e293b] border border-[#cbd5e1] hover:bg-[#f8fafc] rounded-xl font-medium transition-all"
            >
              שאלות? דברו איתנו
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
