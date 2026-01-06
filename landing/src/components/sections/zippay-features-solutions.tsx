'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

type SolutionCard = {
  imageSrc: string;
  imageAlt?: string;
  title: string;
  description: string;
};

export type ZippayFeaturesSolutionsProps = {
  tagline?: string;
  title?: string;
  description?: string;
  cards?: SolutionCard[];
  className?: string;
};

const DEFAULT_CARDS: SolutionCard[] = [
  {
    imageSrc: '/images/features/solutions/f1.webp',
    imageAlt: 'Global currencies',
    title: 'Global Currency',
    description:
      'Effortlessly handle international transactions with our intuitive currency management and conversion features',
  },
  {
    imageSrc: '/images/features/solutions/f2.webp',
    imageAlt: 'Subscriptions',
    title: 'Working Capital',
    description:
      'Optimize your working capital efficiently, ensuring smooth cash flow and enhanced financial stability',
  },
  {
    imageSrc: '/images/features/solutions/f3.webp',
    imageAlt: 'Savings widget',
    title: 'Vendor Management',
    description:
      'Streamline all aspects of vendor relationships and payments with our comprehensive management tools',
  },
];

export default function ZippayFeaturesSolutions({
  tagline = 'Solutions',
  title = 'Enhanced AP Automation Software Solutions',
  description = `Keep your business account and all your finance needs safely organized under one roof. Manage money quickly, easily & efficiently. Whether you’re alone or leading a team.`,
  cards = DEFAULT_CARDS,
  className,
}: ZippayFeaturesSolutionsProps) {
  return (
    <section className={cn('px-6 py-10 lg:py-24', className)}>
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-body-xs-medium text-primary-200">
            {tagline}
          </span>

          <h2 className="text-foreground text-heading-1 mt-3 tracking-tight lg:text-[52px]">
            {title}
          </h2>

          <p className="text-body-md sm:text-body-lg mx-auto mt-4 text-gray-400">
            {description}
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:gap-8 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {cards.map((card, i) => (
            <div key={i} className="bg-gray-25 rounded-[16px] p-6">
              <div className="relative mx-auto w-full">
                <Image
                  src={card.imageSrc}
                  alt={card.imageAlt ?? card.title}
                  width={1200}
                  height={800}
                  priority={i === 0}
                  className="h-[220px] w-full object-contain"
                />
              </div>

              <h3 className="text-body-lg-bold text-foreground mt-6">
                {card.title}
              </h3>
              <p className="text-body-md mt-2 text-gray-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
