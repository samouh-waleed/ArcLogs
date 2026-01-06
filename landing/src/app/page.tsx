import ZippayCtaSection from '@/components/sections/zippay-cta-section';
import FeaturesSection from '@/components/sections/features-section';
import ZippayHero from '@/components/sections/hero';
import ArcLogsFeatureQuad from '@/components/sections/ArcLogsFeatureQuad';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
// Import your newly created section
import InsightsSection from '@/components/sections/InsightsSection';

export default function Home() {
  return (
    <>
      <ZippayHero />
      <FeaturesSection />
      <HowItWorksSection />
      {/* Replaces the old Sync section with the new instructional Insights section */}
      <InsightsSection />
      <ArcLogsFeatureQuad />
      <ZippayCtaSection />
    </>
  );
}