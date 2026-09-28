import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ShieldCheck, Zap, Building2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PremiumContactForm } from "../components/PremiumContactForm";
import { useAuth } from "@/lib/auth-context";
import { getUserAccess } from "@/lib/supabase";
import { Seo, SITE_ORIGIN } from "@/app/components/Seo";
import { PricingSection } from "../components/blocks/pricing-section";

const PLAN_ORDER = ['basic', 'professional', 'full'];

function normalizePlan(plan: string | null): string | null {
  return plan === 'premium' ? 'full' : plan;
}

const clinicFlowTiers = [
  {
    name: "Clinic Flow Forever",
    price: "₪1,299",
    description: "כל הכלים לניהול הקליניקה — בתשלום חד־פעמי",
    highlight: true,
    badge: "הכי משתלם",
    icon: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-blue-500/30 blur-2xl rounded-full" />
        <Zap className="w-7 h-7 relative z-10 animate-[float_3s_ease-in-out_infinite]" />
      </div>
    ),
    buttonText: "התחילו עכשיו",
    features: [
      { name: "ניהול יומן פגישות (לומי/שבועי/חודשי)", description: "", included: true },
      { name: "ניהול תיק מטופל ורקע רפואי מלא", description: "", included: true },
      { name: "הפקת סיכומי ביקור מעוצבים ב-PDF", description: "", included: true },
      { name: "הנפקת חשבוניות, קבלות, וקבלות-חשבונית", description: "", included: true },
      { name: "דוחות מעקב, סטטיסטיקות פיננסיות ופעילות", description: "", included: true },
      { name: "חוות דעת מקצועיות (Medical Opinions) עם חתימה", description: "", included: true },
      { name: "הערות דביקות, יומן אישי, תיוגים וחיפוש מתקדם", description: "", included: true },
    ],
  },
  {
    name: "פתרון ארגוני (Enterprise)",
    price: "צור/י קשר",
    description: "לקליניקות גדולות, רשתות ומערכות מורכבות בהתאמה אישית",
    icon: (
      <div className="relative">
        <Building2 className="w-7 h-7 relative z-10" />
      </div>
    ),
    buttonText: "דברו איתנו",
    featuresTitle: "אפשרויות להתאמה אישית",
    features: [
      { name: "כל מה שבחבילת הניהול המלאה +", description: "", included: true },
      { name: "פריסה והטמעה מותאמת לארגון", description: "", included: true },
      { name: "אינטגרציות מותאמות למערכות קיימות", description: "", included: true },
      { name: "ייצוא נתונים דרך API", description: "", included: true },
      { name: "מיתוג ועיצוב מותאמים (לוגו וזיהוי חזותי)", description: "", included: true },
      { name: "ליווי ותמיכה בעדיפות", description: "", included: true },
    ],
  },
];

const pricingFaq = [
  {
    q: "האם הנתונים שלי בטוחים אם המחשב מתקלקל?",
    a: "כן. ClinicFlow כולל גיבוי מוצפן עם סיסמה. שמרו גיבוי על דיסק חיצוני או USB — ותוך דקות תחזרו לעבוד על כל מחשב חדש."
  },
  {
    q: "האם ClinicFlow עובד עם מק ווינדוס?",
    a: "כן. האפליקציה זמינה ל-Windows ול-macOS. ההתקנה לוקחת פחות מדקה."
  },
  {
    q: "מה אם אני לא מרוצה?",
    a: "יש 30 יום להחזר כספי מלא, ללא שאלות. אם זה לא מתאים — מקבלים את הכסף בחזרה."
  },
];

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClinicFlow",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Windows, macOS",
  description:
    "ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך, בתשלום חד־פעמי וללא מנוי. הנתונים נשארים אצלך, בהתאם לתיקון 13.",
  url: `${SITE_ORIGIN}/pricing`,
  offers: [
    {
      "@type": "Offer",
      name: "רישיון לניהול קליניקה",
      price: "1299",
      priceCurrency: "ILS",
      url: `${SITE_ORIGIN}/pricing`,
      availability: "https://schema.org/InStock",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pricingFaq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export function PricingPage() {
  const [showAddOns, setShowAddOns] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  // Inject onClick for the enterprise plan and primary plan
  const tiersWithActions = clinicFlowTiers.map(tier => {
    if (tier.name === "פתרון ארגוני (Enterprise)") {
      return {
        ...tier,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          setIsModalOpen(true);
        }
      };
    }
    if (tier.name === "רישיון לצמיתות") {
      return {
        ...tier,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          if (user) {
            navigate("/payment?plan=forever");
          } else {
            navigate("/signup?redirect=/payment?plan=forever");
          }
        }
      };
    }
    return tier;
  });

  useEffect(() => {
    if (user) {
      getUserAccess(user.id).then(access => {
        if (access?.is_active) setUserPlan(normalizePlan(access.plan));
      });
    }
  }, [user]);

  function getPlanButton(slug: string, isPopular: boolean) {
    if (userPlan) {
      const currentIdx = PLAN_ORDER.indexOf(userPlan);
      const thisIdx = PLAN_ORDER.indexOf(slug);
      if (slug === userPlan) {
        return { label: "✓ החבילה שלך", disabled: true, style: "bg-green-50 text-green-700 border border-green-200 cursor-default" };
      }
      if (thisIdx > currentIdx) {
        return { label: "שדרג/י לחבילה זו", disabled: false, isUpgrade: true, style: isPopular ? "bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white shadow-lg shadow-[#0d47a1]/25 hover:shadow-xl hover:shadow-[#0d47a1]/40 hover:-translate-y-0.5" : "bg-white text-[#0d47a1] border-2 border-[#0d47a1] shadow-md hover:bg-[#0d47a1] hover:text-white hover:shadow-lg hover:-translate-y-0.5" };
      }
      return { label: "חבילה נמוכה יותר", disabled: true, style: "bg-[#f5f7f9] text-[#6b7c93] border border-[#e1e6ec] cursor-not-allowed" };
    }
    return {
      label: "התחילו עכשיו",
      disabled: false,
      isUpgrade: false,
      style: isPopular
        ? "bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white shadow-lg shadow-[#0d47a1]/25 hover:shadow-xl hover:shadow-[#0d47a1]/40 hover:-translate-y-0.5"
        : "bg-white text-[#0d47a1] border-2 border-[#0d47a1] shadow-md hover:bg-[#0d47a1] hover:text-white hover:shadow-lg hover:-translate-y-0.5"
    };
  }

  return (
    <div className="pt-32 pb-20">
      <Seo
        title="מחיר תוכנה לניהול קליניקה – תשלום חד פעמי מ־899 ₪"
        description="מחיר ClinicFlow — תוכנה לניהול קליניקה בתשלום חד־פעמי וללא מנוי: חבילה בסיסית 899 ₪, מקצועית 999 ₪ וניהול מלאה 1,299 ₪. רישיון לצמיתות ו־30 יום החזר כספי מלא."
        canonicalPath="/pricing"
        jsonLd={[softwareAppJsonLd, faqJsonLd]}
      />
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Guarantee badge */}
        <div className="flex items-center justify-center -mt-6 mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2.5 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">30 יום החזר כספי מלא</span>
          </div>
        </div>

        <PricingSection tiers={tiersWithActions} />

        {/* Enterprise Contact Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-[#1a2332]/60 backdrop-blur-sm"
              />
              
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 md:p-10 z-10"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 left-4 p-2 text-[#6b7c93] hover:text-[#1a2332] bg-[#f5f7f9] hover:bg-[#e1e6ec] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-[#1a2332] mb-2">צרו קשר לפתרון ארגוני</h3>
                  <p className="text-[#6b7c93]">
                    השאירו פרטים ונחזור אליכם עם הצעה המותאמת במיוחד לצרכי הקליניקה שלכם.
                  </p>
                </div>
                
                <PremiumContactForm />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-3xl mx-auto mt-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2332] text-center mb-8">שאלות נפוצות</h2>
          <div className="space-y-4">
            {pricingFaq.map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-[#e1e6ec] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-right"
      >
        <span className="font-medium text-[#1a2332]">{question}</span>
        <ChevronDown className={`w-5 h-5 text-[#6b7c93] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 text-[#6b7c93] leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
