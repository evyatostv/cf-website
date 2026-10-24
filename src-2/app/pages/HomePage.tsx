import { Hero } from "@/app/components/Hero";
import { SecuritySection } from "@/app/components/SecuritySection";
import { FeaturesSection } from "@/app/components/FeaturesSection";
import { DashboardPreview } from "@/app/components/DashboardPreview";
import { OfflineBenefits } from "@/app/components/OfflineBenefits";
import { CTASection } from "@/app/components/CTASection";
import { PremiumContactForm } from "@/app/components/PremiumContactForm";
import { Seo, SITE_ORIGIN } from "@/app/components/Seo";

const HOME_DESCRIPTION =
  "תוכנה לניהול קליניקה שעובדת אופליין על המחשב שלך – ללא מנוי חודשי, תשלום חד-פעמי. תיק רפואי דיגיטלי, יומן תורים וחשבוניות. הנתונים נשארים אצלך, בהתאם לתיקון 13.";

const SOFTWARE_APP_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClinicFlow",
  applicationCategory: ["MedicalApplication", "BusinessApplication"],
  operatingSystem: "Windows",
  url: SITE_ORIGIN,
  inLanguage: "he",
  description: HOME_DESCRIPTION,
  offers: [
    {
      "@type": "Offer",
      name: "ClinicFlow — רישיון לצמיתות",
      price: "1499",
      priceCurrency: "ILS",
      url: `${SITE_ORIGIN}/pricing`,
    },
  ],
};

export function HomePage() {
  return (
    <>
      <Seo
        title="תוכנה לניהול קליניקה ללא מנוי – אופליין ותשלום חד פעמי | ClinicFlow"
        description={HOME_DESCRIPTION}
        canonicalPath="/"
        jsonLd={[SOFTWARE_APP_JSON_LD]}
      />
      <Hero />
      <SecuritySection />
      <FeaturesSection />
      <DashboardPreview />
      <OfflineBenefits />
      <CTASection />
      <section id="lead-form" className="scroll-mt-24 py-16 sm:py-24 bg-[#f8fafc]">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0f172a] mb-3">רוצים לראות את המערכת בפעולה?</h2>
            <p className="text-[#64748b] text-base sm:text-lg">השאירו פרטים ונחזור אליכם לשיחה קצרה ותיאום הדגמה — ללא שום התחייבות.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#cbd5e1] shadow-sm">
            <PremiumContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
