'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

type BigCard = {
  imageSrc: string;
  imageAlt?: string;
  title: string;
  description: string;
  href?: string;
};

type SmallCard = {
  iconSrc: string;
  iconAlt?: string;
  title: string;
  description: string;
  href?: string;
};

export interface ZippayFeaturesSectionProps {
  id?: string;
  tagline?: string;
  title?: string;
  description?: string;
  bigCards?: BigCard[];
  smallCards?: SmallCard[];
}

const DEFAULT_BIG: BigCard[] = [
  {
    imageSrc: '/images/homepage/features/feature-1.jpg',
    imageAlt: 'Async standups with voice and text updates',
    title: 'Async Standups',
    description:
      'Team members share updates via voice or text on their own schedule, eliminating live meetings.',
  },
  {
    imageSrc: '/images/homepage/features/feature-2.jpg',
    imageAlt: 'AI-powered insights dashboard',
    title: 'AI-Powered Insights',
    description:
      'AI automatically surfaces blockers, help requests, and key themes from daily updates.',
  },
];

const DEFAULT_SMALL: SmallCard[] = [
  {
    iconSrc: '/images/homepage/features/feature-icon-1.png',
    iconAlt: 'Automated routing',
    title: 'Automated Routing',
    description:
      'Blockers are routed automatically to the right people for faster resolution.',
  },
  {
    iconSrc: '/images/homepage/features/feature-icon-2.png',
    iconAlt: 'Team dashboard',
    title: 'Team Dashboard',
    description:
      'Review all team updates, insights, and historical data in one central view.',
  },
  {
    iconSrc: '/images/homepage/features/feature-icon-3.png',
    iconAlt: 'Integrations',
    title: 'Integrations',
    description:
      'Connect with Slack, Zapier, and other tools for a seamless workflow.',
  },
];

export default function ZippayFeaturesSection({
  id = 'zippay-features',
  tagline = 'Features',
  title = 'Everything You Need to Control Spend',
  description = `Keep your business account and all your finance needs safely organized under one roof.
Manage money quickly, easily & efficiently. Whether you’re alone or leading a team.`,
  bigCards = DEFAULT_BIG,
  smallCards = DEFAULT_SMALL,
}: ZippayFeaturesSectionProps) {
  return (
    <section id={id} className="bg-background px-6">
      <div className="container py-10 lg:pt-30 lg:pb-24">
        {/* Header Section */}
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
          <span className="text-body-xs-medium bg-gray-0 inline-flex h-8 items-center gap-2 rounded-[10px] px-3 py-0 leading-none shadow-md">
            <Image
              src="/images/homepage/features/elipse.svg"
              alt="elipse"
              width={6}
              height={6}
              className="h-[6px] w-[6px]"
            />
            {tagline}
          </span>

          <h2 className="text-foreground text-heading-1 mt-4 max-w-[616px] tracking-tight lg:text-[52px]">
            {title}
          </h2>

          <p className="text-body-md sm:text-body-lg mx-auto mt-4 max-w-3xl text-gray-400">
            {description}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:mt-14">
          {/* BIG CARDS SECTION */}
          <div className="grid gap-6 lg:grid-cols-2">
            {bigCards.map((card, i) => {
              const content = (
                <article
                  key={i}
                  // UPDATED: Removed border, added shadow-xl for popped-up effect
                  className="bg-gray-0 group flex flex-col gap-4 overflow-hidden rounded-[16px] p-4 shadow-xl transition-shadow duration-300 hover:shadow-2xl"
                >
                  <div className="overflow-hidden rounded-[12px] bg-gray-50">
                    {/* ANIMATED IMAGE CONTAINER */}
                    <motion.div
                      className="relative aspect-video w-full"
                      // Entrance Animation: Slide Up + Fade In
                      initial={{ opacity: 0, y: 40, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.2,
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }}
                      // Hover Animation: Subtle Zoom
                      whileHover={{ scale: 1.05 }}
                    >
                      <Image
                        src={card.imageSrc}
                        alt={card.imageAlt || card.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-in-out"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </motion.div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-foreground text-heading-4">
                      {card.title}
                    </h3>
                    <p className="text-body-md mt-2 text-gray-400">
                      {card.description}
                    </p>
                  </div>
                </article>
              );

              return card.href ? (
                <Link key={i} href={card.href} className="block">
                  {content}
                </Link>
              ) : (
                content
              );
            })}
          </div>

          {/* SMALL CARDS SECTION */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {smallCards.map((card, i) => {
              const item = (
                <article
                  key={i}
                  // UPDATED: Removed border, added shadow-xl
                  className="bg-gray-0 flex flex-col gap-6 rounded-[16px] p-6 shadow-xl transition-shadow duration-300 hover:shadow-2xl"
                >
                  <Image
                    src={card.iconSrc}
                    alt={card.iconAlt ?? card.title}
                    // UPDATED: Increased size from 52 to 80
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                  <div className="flex items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="text-foreground text-heading-5">
                        {card.title}
                      </h4>
                      <p className="text-body-md mt-1.5 text-gray-400">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </article>
              );

              return card.href ? (
                <Link key={i} href={card.href} className="block">
                  {item}
                </Link>
              ) : (
                item
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
