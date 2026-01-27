import { Hero } from "@/app/components/Hero";
import { SecuritySection } from "@/app/components/SecuritySection";
import { FeaturesSection } from "@/app/components/FeaturesSection";
import { DashboardPreview } from "@/app/components/DashboardPreview";
import { OfflineBenefits } from "@/app/components/OfflineBenefits";
import { ReviewsCarousel } from "@/app/components/ReviewsCarousel";
import { CTASection } from "@/app/components/CTASection";

export function HomePage() {
  return (
    <>
      <Hero />
      <SecuritySection />
      <FeaturesSection />
      <DashboardPreview />
      <OfflineBenefits />
      <ReviewsCarousel />
      <CTASection />
    </>
  );
}
