import Image from 'next/image';
import Link from 'next/link';

import CardsIllustration from './cards-illustrations';
import ExpenseIllustration from './expense-illustration';

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
    imageSrc: '/images/homepage/features/zippay-feature-1.webp',
    imageAlt: 'Expense management UI',
    title: 'Expense Management',
    description:
      'Automated expense management software built into your corporate card, reimbursements, and more',
  },
  {
    imageSrc: '/images/homepage/features/zippay-feature-2.webp',
    imageAlt: 'Global card UI',
    title: 'Global Corporate Card',
    description:
      'Handle cross-border payments and currency conversions with a single global corporate card',
  },
];

const DEFAULT_SMALL: SmallCard[] = [
  {
    iconSrc: '/images/homepage/features/feature-icon-1.svg',
    iconAlt: 'Accounts Payable',
    title: 'Accounts Payable',
    description:
      'Streamline and automate your payments to vendors and suppliers',
  },
  {
    iconSrc: '/images/homepage/features/feature-icon-2.svg',
    iconAlt: 'Procurement',
    title: 'Procurement',
    description:
      'Simplify your purchasing process with efficient and integrated solutions',
  },
  {
    iconSrc: '/images/homepage/features/feature-icon-3.svg',
    iconAlt: 'Accounting Automation',
    title: 'Accounting Automation',
    description:
      'Automate repetitive tasks to enhance accuracy and efficiency in accounting',
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
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
          <span className="text-body-xs-medium bg-gray-0 inline-flex h-8 items-center gap-2 rounded-[10px] border border-gray-100 px-3 py-0 leading-none shadow-[0_1px_2px_0_rgba(13,13,18,0.06)]">
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
          <div className="grid gap-6 lg:grid-cols-2">
            {bigCards.map((card, i) => {
              const content = (
                <article
                  key={i}
                  className="bg-gray-0 flex flex-col gap-4 rounded-[16px] border border-gray-50 p-4 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)]"
                >
                  <div className="bg-gray-0 rounded-[12px]">
                    <div className="bg-gray-0 rounded-[12px]">
                      {i === 0 ? (
                        <ExpenseIllustration
                          className="h-auto w-full"
                          once={true}
                          delayStep={0.45}
                          x={40}
                          duration={0.9}
                          inViewAmount={0.9}
                        />
                      ) : (
                        <CardsIllustration
                          className="h-auto w-full"
                          inViewAmount={0.7}
                          y={40}
                          duration={0.9}
                          delayStep={0.45}
                          startDelay={0.3}
                          once
                        />
                      )}
                    </div>
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {smallCards.map((card, i) => {
              const item = (
                <article
                  key={i}
                  className="bg-gray-0 flex flex-col gap-6 rounded-[16px] border border-gray-50 p-6 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)]"
                >
                  <Image
                    src={card.iconSrc}
                    alt={card.iconAlt ?? card.title}
                    width={52}
                    height={52}
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
