import ZippayContentsSection from '@/components/sections/zippay-contents-section';
import ZippayCtaSection from '@/components/sections/zippay-cta-section';
import ZippayFeatureQuad from '@/components/sections/zippay-feature-quad';
import ZippayFeaturesSection from '@/components/sections/zippay-features-section';
import ZippayHero from '@/components/sections/zippay-hero';
import ZippayTestimonialsSection from '@/components/sections/zippay-testimonials-section';

export default function Home() {
  return (
    <>
      <ZippayHero />
      <ZippayFeaturesSection />
      <ZippayContentsSection />
      <ZippayFeatureQuad />
      <ZippayTestimonialsSection />
      <ZippayCtaSection />
    </>
  );
}
