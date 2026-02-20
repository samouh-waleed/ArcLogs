'use client';

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

export type ArcLogsPricingHeroProps = {
  tagline?: string;
  title?: string;
  description?: string;
  plans?: Plan[];
};

const DEFAULT_PLANS: Plan[] = [
  {
    name: 'Free',
    description:
      'Perfect for small teams looking to eliminate daily meeting overhead.',
    price: 0,
    period: '/ Forever',
    ctaLabel: 'Get Started',
    href: 'https://app.arclogs.com/login',
    features: [
      'Up to 10 users',
      '1 active team',
      'Basic AI Analysis',
      '30-day data retention',
    ],
  },
  {
    name: 'Pro',
    description:
      'Advanced AI insights and integrations for growing distributed teams.',
    price: 12,
    period: '/ user / month',
    ctaLabel: 'Start Free Trial',
    href: 'https://app.arclogs.com/login',
    features: [
      'Unlimited teams',
      'Advanced AI Insight Extraction',
      'Slack & Zapier Integrations',
      'Full Analytics and Exports',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    description:
      'Custom security, compliance, and support for large organizations.',
    price: 'Custom',
    period: '',
    ctaLabel: 'Contact Sales',
    href: '/contact',
    features: [
      'SSO / SAML Authentication',
      'SOC 2 Compliance',
      'Dedicated Support Manager',
      'Custom AI Training & Models',
    ],
  },
];

export default function ArcLogsPricingHero({
  tagline = 'Pricing',
  title = 'Skip the Standup. Keep the Alignment.',
  description = `Save 5+ hours per week while improving information flow across your distributed team.`,
  plans = DEFAULT_PLANS,
}: ArcLogsPricingHeroProps) {
  return (
    <section className="bg-gray-25 px-6 py-10 lg:py-24">
      <div className="container">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
          <span className="text-body-sm-medium text-primary">{tagline}</span>
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
            const isCustom = typeof p.price === 'string';

            return (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border p-2 shadow-sm transition-all hover:shadow-md',
                  isHighlight
                    ? 'bg-primary-300 border-white/10 text-white'
                    : 'border-gray-50 bg-white',
                )}
              >
                <div className="p-4">
                  <h3
                    className={cn(
                      'text-body-lg-bold text-[20px]',
                      isHighlight ? 'text-white' : 'text-foreground',
                    )}
                  >
                    {p.name}
                  </h3>
                  <p
                    className={cn(
                      'text-body-sm mt-2 min-h-[40px]',
                      isHighlight ? 'text-white/80' : 'text-gray-400',
                    )}
                  >
                    {p.description}
                  </p>

                  <div
                    className={cn(
                      'my-6 w-full border-t border-dashed',
                      isHighlight ? 'border-white/10' : 'border-gray-100',
                    )}
                  />

                  <div className="mt-6 flex items-baseline gap-1">
                    <span
                      className={cn(
                        'text-[40px] leading-none font-bold tracking-tight',
                        isHighlight ? 'text-white' : 'text-foreground',
                      )}
                    >
                      {!isCustom && '$'}
                      {p.price}
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

                  <div className="mt-6">
                    <Button
                      asChild
                      className={cn(
                        'w-full font-bold',
                        isHighlight
                          ? 'bg-white text-blue-900 hover:bg-gray-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700',
                      )}
                    >
                      <Link href={p.href ?? '#'}>{p.ctaLabel}</Link>
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    'mt-6 rounded-xl border p-5',
                    isHighlight
                      ? 'border-white/10 bg-white/5'
                      : 'border-gray-100 bg-gray-50',
                  )}
                >
                  <p
                    className={cn(
                      'text-body-sm-medium mb-4',
                      isHighlight ? 'text-white/90' : 'text-gray-500',
                    )}
                  >
                    Key Features:
                  </p>
                  <ul className="space-y-3">
                    {p.features.map((f, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          'text-body-sm flex items-start gap-2',
                          isHighlight ? 'text-white/85' : 'text-gray-700',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full',
                            isHighlight ? 'bg-white/60' : 'bg-blue-500',
                          )}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
