import React from 'react';

import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import ZippayIntegrationsHero from '@/components/sections/zippay-integrations-hero';
import ZippayIntegrationsList, {
  IntegrationCard,
} from '@/components/sections/zippay-integrations-list';
import { getAllIntegrations } from '@/lib/integrations';

const page = () => {
  const all = getAllIntegrations();

  const items: IntegrationCard[] = all.map((i) => ({
    slug: i.slug,
    name: i.title,
    category: i.category,
    summary: i.summary,
    icon: i.icon,
    badges: i.badges,
  }));

  return (
    <>
      <ZippayIntegrationsHero />
      <ZippayIntegrationsList items={items} />
      <ZippayCtaCard />
    </>
  );
};

export default page;
