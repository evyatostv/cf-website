import { AnimatePresence, motion } from "motion/react";
import { Building2, ChevronDown, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth-context";
import { getPaidUserAccess } from "@/lib/supabase";
import { Seo, SITE_ORIGIN } from "@/app/components/Seo";
import { PricingSection } from "../components/blocks/pricing-section";
import { PremiumContactForm } from "../components/PremiumContactForm";
import { trackMarketingEvent } from "@/lib/marketing-analytics";

const clinicFlowTiers = [
  {
    name: "ClinicFlow — רישיון לצמיתות",
    price: "₪1,499",
    description: "כל הכלים לניהול הקליניקה — בתשלום חד פעמי",
    highlight: true,
    badge: "הרישיון המלא",
    icon: <Zap className="w-6 h-6 text-[#0d47a1]" />,
    buttonText: "רכישת רישיון",
    features: [
      { name: "ניהול יומן פגישות (יומי/שבועי/חודשי)", description: "", included: true },
      { name: "ניהול תיק מטופל ורקע רפואי מלא", description: "", included: true },
      { name: "הפקת סיכומי ביקור מעוצבים ב-PDF", description: "", included: true },
      { name: "הנפקת חשבוניות, קבלות, וקבלות-חשבונית", description: "", included: true },
      { name: "דוחות מעקב, סטטיסטיקות פיננסיות ופעילות", description: "", included: true },
      { name: "חוות דעת מקצועיות (Medical Opinions) עם חתימה", description: "", included: true },
      { name: "הערות דביקות, יומן אישי, תיוגים וחיפוש מתקדם", description: "", included: true },
      { name: "גיבוי מוצפן בסיסמה להתקן חיצוני / USB", description: "", included: true },
      { name: "התקנה על Windows ועל macOS", description: "", included: true },
    ],
  },
  {
    name: "Enterprise — פתרון מותאם",
    price: "צרו קשר",
    description: "לקליניקות גדולות, מרכזים רפואיים או צרכים מיוחדים",
    icon: <Building2 className="w-6 h-6 text-[#475569]" />,
    buttonText: "דברו איתנו",
    featuresTitle: "אפשרויות להתאמה",
    features: [
      { name: "התאמות לתהליך העבודה של הקליניקה", description: "", included: true },
      { name: "פריסה והטמעה מותאמת", description: "", included: true },
      { name: "אינטגרציות לפי הצורך והיתכנות", description: "", included: true },
      { name: "מיתוג ועיצוב מותאמים", description: "", included: true },
      { name: "ליווי ותמיכה בעדיפות", description: "", included: true },
    ],
  },
];

const pricingFaq = [
  {
    q: "האם הנתונים שלי בטוחים אם המחשב מתקלקל?",
    a: "צרו גיבוי ידני מוצפן ושמרו עותק עדכני גם מחוץ למחשב המרפאה. לשחזור במחשב חלופי תצטרכו את קובץ הגיבוי, את סיסמת הגיבוי ואת מפתח השחזור של המשתמש במרפאה. אם אתם מתכננים לעבור מחשב, אפשר לפנות אלינו לפני המעבר."
  },
  {
    q: "האם ClinicFlow עובד עם מק ווינדוס?",
    a: "כן. האפליקציה זמינה ל-Windows 10/11 במחשבי Intel או AMD ‏(64 סיביות), ול-macOS 12 ומעלה במחשבי Apple Silicon."
  },
  {
    q: "כמה עולה לעבוד גם בבית וגם במרפאה?",
    a: "לשני מחשבים שרוצים להשאיר פעילים צריך שני רישיונות באותו חשבון. המחיר הוא 1,499 ₪ בתשלום חד־פעמי לכל מחשב, ובסך הכול 2,998 ₪ לשניים. כבר רכשתם רישיון? באזור האישי בחרו ״רכישת רישיון למחשב נוסף״. אפשר להוסיף כך גם מחשב שלישי. אם אתם מחליפים מחשב ישן ומפסיקים להשתמש בו, אפשר להעביר את הרישיון הקיים. נשמח לעזור לכם לבחור לפני הרכישה."
  },
  {
    q: "האם פתיחת התוכנה במרפאה מנתקת את המחשב בבית?",
    a: "כשיש רישיון לכל מחשב, שניהם נשארים פעילים. להפעלה הראשונית דרוש חיבור לאינטרנט. אחר כך אפשר לעבוד גם בלי חיבור. אם העברתם רישיון ממחשב ישן למחשב חדש, המחשב הישן יקבל את השינוי בפעם הבאה שהתוכנה תיפתח ותצליח לבדוק את הרישיון באינטרנט."
  },
  {
    q: "איך ממשיכים בבית ביקור שנכתב במרפאה?",
    a: "הביקורים והקבצים נשמרים בכל מחשב בנפרד. בסיום העבודה במרפאה צרו גיבוי ידני מוצפן, העבירו אותו ב־USB ושחזרו בבית. לפני שחוזרים לעבוד במרפאה, העבירו אליה את הגיבוי העדכני מהבית. אם כבר ערכתם בשני המחשבים, שמרו גיבוי מכל אחד ופנו אלינו לפני שחזור."
  },
  {
    q: "איך שומרים על מספור קבלות כשעובדים בשני מחשבים?",
    a: "הפיקו קבלות וחשבוניות מעותק העבודה העדכני של המרפאה. שני מחשבים מנותקים עלולים להקצות את אותו מספר. כשעוברים מחשב, שחזרו את הגיבוי העדכני ובדקו שהמסמך האחרון מופיע לפני שמפיקים את הבא."
  },
];

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClinicFlow",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Windows, macOS",
  description:
    "ClinicFlow — תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך, בתשלום חד פעמי וללא מנוי. הנתונים נשארים אצלך, בהתאם לתיקון 13.",
  url: `${SITE_ORIGIN}/pricing`,
  offers: [
    {
      "@type": "Offer",
      name: "רישיון לניהול קליניקה",
      price: "1499",
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
  const { user } = useAuth();
  const [hasActiveLicense, setHasActiveLicense] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const enterpriseDialogRef = useRef<HTMLDivElement>(null);
  const enterpriseTriggerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  const measuredView = useRef(false);
  useEffect(() => {
    if (measuredView.current) return;
    measuredView.current = true;
    trackMarketingEvent('pricing_viewed');
  }, []);

  // There is one product and one checkout path.
  const tiersWithActions = clinicFlowTiers.map(tier => {
    if (tier.name === "Enterprise — פתרון מותאם") {
      return {
        ...tier,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          enterpriseTriggerRef.current = e.currentTarget as HTMLElement;
          setIsEnterpriseModalOpen(true);
        },
      };
    }

    return {
      ...tier,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        if (user && !accessLoaded) return;
        if (hasActiveLicense || lookupFailed) {
          navigate("/dashboard");
        } else if (user) {
          navigate("/payment?plan=forever");
        } else {
          navigate("/signup?redirect=/payment?plan=forever");
        }
      },
      buttonText: lookupFailed ? "לבדיקת הרישיון" : hasActiveLicense ? "לניהול הרישיון" : user && !accessLoaded ? "בודק רישיון..." : tier.buttonText,
      disabled: Boolean(user && !accessLoaded),
    };
  });

  useEffect(() => {
    let current = true;
    setHasActiveLicense(false);
    setAccessLoaded(!user);
    if (user) {
      getPaidUserAccess(user.id).then(access => {
        if (current) setHasActiveLicense(Boolean(access));
      }).catch(() => {
        if (current) setLookupFailed(true);
      }).finally(() => { if (current) setAccessLoaded(true); });
    }
    setLookupFailed(false);
    return () => { current = false; };
  }, [user]);

  useEffect(() => {
    if (!isEnterpriseModalOpen) return;

    const dialog = enterpriseDialogRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
      .filter((element) => !element.hasAttribute("disabled"));

    getFocusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsEnterpriseModalOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      enterpriseTriggerRef.current?.focus();
    };
  }, [isEnterpriseModalOpen]);

  return (
    <div className="pt-32 pb-20">
      <Seo
        title="מחיר ClinicFlow – 1,499 ₪ בתשלום חד פעמי"
        description="ClinicFlow עולה 1,499 ₪ בתשלום חד פעמי. כל יכולות המערכת, רישיון לצמיתות, ללא מנוי חודשי."
        canonicalPath="/pricing"
        jsonLd={[softwareAppJsonLd, faqJsonLd]}
      />
      <div className="container mx-auto px-6 max-w-7xl">
        <PricingSection tiers={tiersWithActions} />

        <AnimatePresence>
          {isEnterpriseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="enterprise-contact-title">
              <motion.button
                type="button"
                aria-label="סגירת טופס יצירת קשר"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEnterpriseModalOpen(false)}
                className="absolute inset-0 bg-[#1a2332]/60 backdrop-blur-sm"
              />
              <motion.div
                ref={enterpriseDialogRef}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10 z-10"
              >
                <button
                  type="button"
                  onClick={() => setIsEnterpriseModalOpen(false)}
                  aria-label="סגירה"
                  className="absolute top-4 left-4 p-2 text-[#6b7c93] hover:text-[#1a2332] bg-[#f5f7f9] hover:bg-[#e1e6ec] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center mb-6">
                  <h3 id="enterprise-contact-title" className="text-2xl font-bold text-[#1a2332] mb-2">פתרון Enterprise מותאם</h3>
                  <p className="text-[#6b7c93]">
                    ספרו לנו על הקליניקה ועל ההתאמות הנדרשות, ונחזור אליכם לבדיקת התאמה והצעה אישית.
                  </p>
                </div>
                <PremiumContactForm mode="enterprise" />
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
