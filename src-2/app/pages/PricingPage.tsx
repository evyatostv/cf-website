import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Link } from "react-router";

const plans = [
  {
    name: "בסיסי",
    price: "₪299",
    period: "חודש",
    description: "מושלם לרופאים יחידים",
    features: [
      "עד 200 מטופלים",
      "ממשק ניהול מלא",
      "דוחות בסיסיים",
      "גיבויים אוטומטיים",
      "תמיכה טכנית במייל",
    ],
  },
  {
    name: "מקצועי",
    price: "₪599",
    period: "חודש",
    description: "לקליניקות קטנות ובינוניות",
    popular: true,
    features: [
      "מטופלים ללא הגבלה",
      "ממשק ניהול מתקדם",
      "דוחות מתקדמים",
      "גיבויים אוטומטיים",
      "תמיכה טכנית 24/7",
      "הכשרה אישית",
      "עדכונים חינם",
    ],
  },
  {
    name: "ארגוני",
    price: "₪1,299",
    period: "חודש",
    description: "לקליניקות גדולות ורשתות",
    features: [
      "מטופלים ללא הגבלה",
      "מספר משתמשים",
      "ניהול הרשאות מתקדם",
      "דוחות מותאמים אישית",
      "גיבויים בענן פרטי",
      "תמיכה טכנית ייעודית",
      "התאמות אישיות",
      "SLA מובטח",
    ],
  },
];

export function PricingPage() {
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
            בחר את התוכנית
            <br />
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#00838f] bg-clip-text text-transparent">
              המתאימה לך
            </span>
          </h1>
          <p className="text-xl text-[#6b7c93] max-w-2xl mx-auto">
            כל התוכניות כוללות את כל היכולות הבסיסיות. אין עלויות נסתרות.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-white rounded-3xl p-8 border-2 ${
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

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#00838f] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1a2332]">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className={`block w-full py-4 rounded-xl text-center font-medium transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#0d47a1] to-[#00838f] text-white hover:shadow-lg"
                    : "bg-[#f5f7f9] text-[#1a2332] hover:bg-[#e8f4f8]"
                }`}
              >
                התחל עכשיו
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
