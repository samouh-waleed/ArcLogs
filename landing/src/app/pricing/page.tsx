import React from 'react';

// import ZippayComparisonPlan from '@/components/sections/zippay-comparison-plan';
import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import ZippayFAQ from '@/components/sections/zippay-faq';
import ZippayPricingHero from '@/components/sections/pricing-hero';

const page = () => {
  return (
    <>
      <ZippayPricingHero />
      {/* <ZippayComparisonPlan /> */}
      <ZippayFAQ softBg={true} />
      <ZippayCtaCard softBg={true} />
    </>
  );
};

export default page;
