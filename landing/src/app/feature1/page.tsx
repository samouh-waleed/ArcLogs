import React from 'react';

import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import ZippayFAQ from '@/components/sections/zippay-faq';
import ZippayFeaturesHero from '@/components/sections/zippay-features-hero';
import ZippayFeaturesSolutions from '@/components/sections/zippay-features-solutions';
import ZippayFeaturesTabs from '@/components/sections/zippay-features-tabs';

const page = () => {
  return (
    <>
      <ZippayFeaturesHero />
      <ZippayFeaturesSolutions />
      <ZippayFeaturesTabs />
      <ZippayFAQ />
      <ZippayCtaCard />
    </>
  );
};

export default page;
