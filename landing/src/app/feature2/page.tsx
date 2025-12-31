import React from 'react';

import ZippayContentsSection from '@/components/sections/zippay-contents-section';
import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import ZippayFAQ from '@/components/sections/zippay-faq';
import ZippayFeatureBullets from '@/components/sections/zippay-features-bullets';
import ZippayLogos from '@/components/sections/zippay-logos';
import ZippaySolutionsHero from '@/components/sections/zippay-solutions-hero';

const page = () => {
  return (
    <>
      <ZippaySolutionsHero />
      <ZippayLogos />
      <ZippayContentsSection />
      <ZippayFeatureBullets />
      <ZippayFAQ />
      <ZippayCtaCard />
    </>
  );
};

export default page;
