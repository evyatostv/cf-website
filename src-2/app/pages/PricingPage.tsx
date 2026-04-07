import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { PremiumContactForm } from "../components/PremiumContactForm";
import { useAuth } from "@/lib/auth-context";
import { getUserAccess } from "@/lib/supabase";

const PLAN_ORDER = ['basic', 'professional', 'full', 'premium'];

const regularPlans = [
  {
    slug: "basic",
    name: "חבילה בסיסית",
    price: "₪759",
    period: "לנצח",
    description: "למטפלים יחידים שרוצים להתחיל",
    newFeatures: [
      "הפקת סיכומי ביקור מעוצבים",
      "יצירת מסמכי PDF",
      "ניהול יומן פגישות (לוח שנה יומי/שבועי/חודשי)",
      "ניהול חולים ורקע רפואי",
    ],
  },
  {
    slug: "professional",
    name: "חבילה מקצועית",
    price: "₪999",
    period: "לנצח",
    description: "לקליניקות קטנות עם ארגון מתקדם",
    popular: true,
    newFeatures: [
      "כל מה שבחבילה הבסיסית +",
      "דוח מעקב סטטיסטי (פגישות, מסמכים, שעות עבודה)",
      "גרפים וניתוח נתונים (ביקורים בשבוע, מסמכים בשבוע)",
      "יומן אישי ותיוג רשומות",
      "הערות דביקות ב-Dashboard",
      "חיפוש וסינון מתקדם",
    ],
  },
  {
    slug: "full",
    name: "חבילת ניהול מלאה",
    price: "₪1,299",
    period: "לנצח",
    description: "לקליניקות בינוניות עם ניהול כספי",
    newFeatures: [
      "כל מה שבחבילת ניהול היומן +",
      "דוח הכנסות ודוחות פיננסיים",
      "הנפקת קבלות תשלום",
      "הנפקת חשבוניות",
      "קבלה וחשבונית משולבת",
      "עקבוי שיטות תשלום וסוגי שירותים",
    ],
  },
];

const premiumPlan = {
  name: "חבילת פרימיום",
  price: null,
  period: "צור קשר",
  description: "לקליניקות גדולות ורשתות עם צרכים מיוחדים",
  newFeatures: [
    "כל מה שבחבילת הניהול המלאה +",
    "מסמכים מותאמים אישית (תבניות לפי מטפל/ת)",
    "חוות דעת מקצועיות (Medical Opinions) עם חתימה",
    "יצירת מסמכים מותאמים נוספים",
    "תמיכה ריבוי רופאים במערכת",
    "ניהול פרופיל מטפל/ת מתקדם",
  ],
};

const premiumAddOns = [
  "העלאת לוגו וזיהוי חזותי",
  "התאמה אישית של שוליים במסמכים",
  "סידור מנוודה גרור ושחרור",
  "הגדרות מתקדמות ותצוגה מותאמת",
  "ניהול ריאקוורי וחזרה לגיבוי",
  "תמיכה ריבוי תפקידים בחשבון",
  "אפליקציה לנייד",
  "אינטגרציות מותאמות",
  "ייצוא נתונים API",
  "תמיכה עדיפות",
];

export function PricingPage() {
  const [showAddOns, setShowAddOns] = useState(false);
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getUserAccess(user.id).then(access => {
        if (access?.is_active) setUserPlan(access.plan);
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
        return { label: "שדרג לחבילה זו", disabled: false, isUpgrade: true, style: isPopular ? "bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white hover:shadow-lg hover:shadow-[#0d47a1]/30" : "bg-[#f5f7f9] text-[#1a2332] hover:bg-[#e8f4f8] border border-[#d1dbe5] hover:border-[#0d47a1]" };
      }
      return { label: "חבילה נמוכה יותר", disabled: true, style: "bg-[#f5f7f9] text-[#6b7c93] border border-[#e1e6ec] cursor-default" };
    }
    return {
      label: "התחילו עכשיו",
      disabled: false,
      isUpgrade: false,
      style: isPopular
        ? "bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white hover:shadow-lg hover:shadow-[#0d47a1]/30"
        : "bg-[#f5f7f9] text-[#1a2332] hover:bg-[#e8f4f8] border border-[#d1dbe5] hover:border-[#0d47a1]"
    };
  }

  return (
    <div className="pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-[#1a2332] mb-6">
            בחרו את החבילה
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              המתאימה לכם
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto">
            כל החבילות כוללות רישיון לצמיתות — ללא עלויות חודשיות או שנתיות.
            <br />
            <span className="font-semibold">תשלום חד-פעמי בלבד.</span>
          </p>
        </motion.div>

        {/* Regular 3 Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {regularPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-white rounded-3xl p-8 border-2 flex flex-col ${
                plan.popular ? "border-[#0d47a1] shadow-xl shadow-[#0d47a1]/10" : "border-[#e1e6ec]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white px-6 py-2 rounded-full text-sm font-medium">
                    הכי פופולרי
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#1a2332] mb-2">{plan.name}</h3>
                <p className="text-[#6b7c93] mb-6">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-[#1a2332]">{plan.price}</span>
                  <span className="text-[#6b7c93]">/ {plan.period}</span>
                </div>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {plan.newFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00838f] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1a2332]">{feature}</span>
                  </li>
                ))}
                </ul>
              </div>

              {(() => {
                const btn = getPlanButton(plan.slug, !!plan.popular);
                return btn.disabled ? (
                  <div className={`block w-full py-4 rounded-xl text-center font-medium ${btn.style}`}>
                    {btn.label}
                  </div>
                ) : (
                  <Link
                    to={`/payment?plan=${plan.slug}${btn.isUpgrade ? '&upgrade=true' : ''}`}
                    className={`block w-full py-4 rounded-xl text-center font-medium transition-all active:scale-95 ${btn.style}`}
                  >
                    {btn.label}
                  </Link>
                );
              })()}
            </motion.div>
          ))}
        </div>

        {/* Premium Plan - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#0d47a1] shadow-xl shadow-[#0d47a1]/10 flex flex-col lg:flex-row gap-8">
            {/* Plan Details - Left Side */}
            <div className="flex-grow">
              <h3 className="text-3xl font-bold text-[#1a2332] mb-2">{premiumPlan.name}</h3>
              <p className="text-[#6b7c93] mb-6 text-lg">{premiumPlan.description}</p>

              <ul className="space-y-4 mb-6">
                {premiumPlan.newFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00838f] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1a2332]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Add-ons Toggle Button */}
              <button
                onClick={() => setShowAddOns(!showAddOns)}
                className={`font-bold transition-all mb-4 flex items-center gap-2 ${
                  showAddOns
                    ? "text-[#0d47a1] hover:text-[#00838f]"
                    : "px-4 py-3 rounded-lg border-2 border-[#0d47a1] bg-white text-[#0d47a1] hover:bg-[#f5f7f9] hover:shadow-md active:scale-95"
                }`}
              >
                {showAddOns ? "הסתר Add Ons ▲" : "צפה ב- Add Ons ▼"}
              </button>

              {/* Add-ons List */}
              {showAddOns && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <ul className="space-y-3 mb-3">
                    {premiumAddOns.map((addon, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-[#0d47a1] font-bold text-lg">+</span>
                        <span className="text-[#1a2332] font-medium">{addon}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-[#6b7c93] italic">
                    * מחירים עשויים להשתנות בהתאם לצרכים הספציפיים של הקליניקה
                  </p>
                </motion.div>
              )}
            </div>

            {/* Contact Form - Right Side */}
            <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col justify-center lg:pl-8 lg:border-r border-[#e1e6ec]">
              <PremiumContactForm />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
