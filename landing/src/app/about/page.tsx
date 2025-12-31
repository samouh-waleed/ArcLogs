import ZippayAboutHero from '@/components/sections/zippay-about-hero';
import ZippayCoreValues from '@/components/sections/zippay-core-values';
import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import ZippayMission from '@/components/sections/zippay-mission';
import ZippayTeamMembers from '@/components/sections/zippay-team-members';

export default function AboutPage() {
  return (
    <>
      <ZippayAboutHero />
      <ZippayMission />
      <ZippayCoreValues />
      <ZippayTeamMembers />
      <ZippayCtaCard />
    </>
  );
}
