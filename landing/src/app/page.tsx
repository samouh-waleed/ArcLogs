import ArcLogsFeatureQuad from '@/components/sections/ArcLogsFeatureQuad';
import FeaturesSection from '@/components/sections/features-section';
import ZippayHero from '@/components/sections/hero';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
// Import your newly created section
import InsightsSection from '@/components/sections/InsightsSection';
import ZippayCtaSection from '@/components/sections/zippay-cta-section';

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
