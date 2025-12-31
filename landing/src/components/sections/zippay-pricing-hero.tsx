'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Plan = {
  name: string;
  tagline?: string;
  description: string;
  price: number | string;
  period?: string;
  ctaLabel?: string;
  href?: string;
  iconSrc?: string;
  features: string[];
  highlight?: boolean;
};

type LogoItem = {
  name: string;
  src: string;
  width: number;
  height: number;
  href?: string;
  className?: string;
};

export type ZippayPricingHeroProps = {
  tagline?: string;
  title?: string;
  description?: string;
  plans?: Plan[];
  logos?: LogoItem[];
};

const DEFAULT_PLANS: Plan[] = [
  {
    name: 'Basic Plan:',
    description:
      'Perfect for small businesses with essential tools for streamlined financial management.',
    price: 15,
    period: '/ Per Month',
    ctaLabel: 'Get Started',
    href: '/get-started',
    iconSrc: '/images/pricing/p1.svg',
    features: [
      'Basic Expense Tracking',
      'Standard Global Corporate Card',
      'Manual Accounts Payable Processing',
      'Basic Procurement Tools',
      'Monthly Reporting',
    ],
  },
  {
    name: 'Pro Plan:',
    description:
      'For growing businesses, providing advanced tools for enhanced financial control.',
    price: 50,
    period: '/ Per Month',
    ctaLabel: 'Get Started',
    href: '/get-started',
    iconSrc: '/images/pricing/p2.svg',
    features: [
      'Advanced Expense Management',
      'Enhanced Global Corporate Card Features',
      'Automated Accounts Payable Processing',
      'Integrated Procurement Solutions',
      'Weekly Financial Insights',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise Plan:',
    description:
      'For large organizations, delivering global financial management and automation tools.',
    price: 80,
    period: '/ Per Month',
    ctaLabel: 'Get Started',
    href: '/get-started',
    iconSrc: '/images/pricing/p3.svg',
    features: [
      'Comprehensive Expense Management',
      'Premium Corporate Card Benefits',
      'Automated Accounts Payable and Receivable',
      'Customizable Procurement Workflows',
      'Real-Time Analytics and Reporting',
    ],
  },
];

const DEFAULT_LOGOS: LogoItem[] = [
  {
    name: 'Notion',
    src: '/images/homepage/logos/cl1.svg',
    width: 117,
    height: 44,
    href: 'https://www.notion.so',
    className: 'h-[28px] w-[76px] sm:h-[44px] sm:w-[117px]',
  },
  {
    name: 'Mailchimp',
    src: '/images/homepage/logos/cl2.svg',
    width: 154,
    height: 44,
    href: 'https://mailchimp.com',
    className: 'h-[28px] w-[100px] sm:h-[44px] sm:w-[154px]',
  },
  {
    name: 'Airtable',
    src: '/images/homepage/logos/cl3.svg',
    width: 140,
    height: 44,
    href: 'https://airtable.com',
    className: 'h-[28px] w-[91px] sm:h-[44px] sm:w-[140px]',
  },
  {
    name: 'Evernote',
    src: '/images/homepage/logos/cl6.svg',
    width: 150,
    height: 44,
    href: 'https://gumroad.com',
    className: 'h-[28px] w-[92px] sm:h-[44px] sm:w-[150px]',
  },
  {
    name: 'Gumroad',
    src: '/images/homepage/logos/cl5.svg',
    width: 151,
    height: 44,
    href: 'https://gumroad.com',
    className: 'h-[28px] w-[94px] sm:h-[44px] sm:w-[151px]',
  },
];

export default function ZippayPricingHero({
  tagline = 'Pricing',
  title = 'Spend Wisely, Save More',
  description = `No matter where you are in your growth or the world, Zippay is designed to save you time and money`,
  plans = DEFAULT_PLANS,
  logos = DEFAULT_LOGOS,
}: ZippayPricingHeroProps) {
  return (
    <section className="bg-gray-25 px-6 py-10 lg:py-24 dark:bg-gray-200">
      <div className="container">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
          <span className="text-body-sm-medium text-primary-200">
            {tagline}
          </span>
          <h2 className="text-foreground text-heading-1 mt-4 max-w-[616px] tracking-tight lg:text-[52px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mt-4 max-w-[516px] text-gray-400">
            {description}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:mt-16 lg:grid-cols-3">
          {plans.map((p, i) => {
            const isHighlight = !!p.highlight;
            return (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border p-2 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)]',
                  isHighlight
                    ? 'bg-primary-300 border-white/10 text-white'
                    : 'bg-gray-0 border-gray-50',
                )}
              >
                <div className="p-4">
                  {p.iconSrc && (
                    <Image
                      src={p.iconSrc}
                      alt=""
                      width={40}
                      height={40}
                      className={cn('mb-5 h-10 w-10 object-contain')}
                    />
                  )}

                  <h3
                    className={cn(
                      'text-body-lg-bold',
                      isHighlight
                        ? 'text-body-lg-bold text-[18px] font-bold text-white'
                        : 'text-foreground text-body-lg-bold',
                    )}
                  >
                    {p.name}
                  </h3>
                  <p
                    className={cn(
                      'text-body-sm mt-2',
                      isHighlight ? 'text-white/80' : 'text-gray-400',
                    )}
                  >
                    {p.description}
                  </p>

                  <div
                    className={cn(
                      'my-6 w-full border-t-2 border-dashed',
                      isHighlight ? 'border-gray-0/10' : 'border-gray-200/30',
                    )}
                  ></div>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span
                      className={cn(
                        'text-[40px] leading-none font-bold tracking-tight',
                        isHighlight ? 'text-white' : 'text-foreground',
                      )}
                    >
                      ${p.price}
                    </span>
                    {p.period && (
                      <span
                        className={cn(
                          'text-body-sm',
                          isHighlight ? 'text-white/80' : 'text-gray-400',
                        )}
                      >
                        {p.period}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      asChild
                      className={cn(
                        'w-full',
                        isHighlight ? 'text-gray-900' : '',
                      )}
                      variant={isHighlight ? 'default' : 'secondary'}
                    >
                      <Link href={p.href ?? '/get-started'}>
                        {p.ctaLabel ?? 'Get Started'}
                      </Link>
                    </Button>
                  </div>
                </div>
                <div
                  className={cn(
                    'mt-6 rounded-xl border p-4',
                    isHighlight
                      ? 'bg-gray-0/5 border-white/10'
                      : 'bg-gray-25 border-gray-50',
                  )}
                >
                  <p
                    className={cn(
                      'text-body-sm-medium mb-3',
                      isHighlight ? 'text-white/90' : 'text-gray-400',
                    )}
                  >
                    Added Features:
                  </p>
                  <ul className="space-y-2">
                    {p.features.map((f, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          'text-body-sm',
                          isHighlight ? 'text-white/85' : 'text-gray-900',
                        )}
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {!!logos.length && (
          <div className="mt-10 lg:mt-20">
            <p className="text-body-sm text-center text-gray-500">
              Trusted by 25K+ Businesses Teams
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-6 opacity-80 sm:gap-x-10 sm:gap-y-10 lg:justify-between">
              {logos.map((logo) => {
                const img = (
                  <Image
                    key={logo.name}
                    src={logo.src}
                    alt={logo.name}
                    width={logo.width}
                    height={logo.height}
                    loading="lazy"
                    className={cn(
                      'object-contain transition-opacity hover:opacity-70',
                      logo.className,
                    )}
                  />
                );

                return logo.href ? (
                  <Link
                    key={logo.name}
                    href={logo.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex shrink-0 items-center p-2"
                    aria-label={logo.name}
                  >
                    {img}
                  </Link>
                ) : (
                  <span
                    key={logo.name}
                    className="flex shrink-0 items-center p-2"
                  >
                    {img}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
