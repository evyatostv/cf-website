import { Hero } from "@/app/components/Hero";
import { SecuritySection } from "@/app/components/SecuritySection";
import { FeaturesSection } from "@/app/components/FeaturesSection";
import { DashboardPreview } from "@/app/components/DashboardPreview";
import { OfflineBenefits } from "@/app/components/OfflineBenefits";
import { CTASection } from "@/app/components/CTASection";
import { PremiumContactForm } from "@/app/components/PremiumContactForm";
import { Seo, SITE_ORIGIN } from "@/app/components/Seo";

const HOME_DESCRIPTION =
  "תוכנה פשוטה לרופאים עצמאיים שמרכזת תיקי מטופלים, יומן תורים, תיעוד, מסמכים וניהול כספי. 1,499 ₪ בתשלום חד פעמי, ללא מנוי חודשי.";

const SOFTWARE_APP_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ClinicFlow",
  applicationCategory: ["MedicalApplication", "BusinessApplication"],
  operatingSystem: "Windows, macOS",
  url: SITE_ORIGIN,
  inLanguage: "he",
  description: HOME_DESCRIPTION,
  offers: {
    "@type": "Offer",
    name: "ClinicFlow — רישיון לצמיתות",
    price: "1499",
    priceCurrency: "ILS",
    url: `${SITE_ORIGIN}/pricing`,
    availability: "https://schema.org/InStock",
  },
};

export function HomePage() {
  return (
    <>
      <Seo
        title="תוכנה לניהול מרפאה פרטית לרופאים – ללא מנוי | ClinicFlow"
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
      <section id="lead-form" className="scroll-mt-24 py-16 sm:py-24 bg-gradient-to-b from-[#f5f7f9] to-white">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-[#1a2332] mb-3">רוצים לשמוע עוד?</h2>
            <p className="text-[#6b7c93] text-lg">השאירו פרטים ונחזור אליכם — בלי התחייבות.</p>
          </div>
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#e1e6ec] shadow-sm">
            <PremiumContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
