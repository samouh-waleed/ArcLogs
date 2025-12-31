'use client';

import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PlanKey = 'basic' | 'pro' | 'enterprise';

type Plan = {
  key: PlanKey;
  title: string;
  subtitle?: string;
  href: string;
  ctaLabel?: string;
  featured?: boolean;
};

type FeatureRow = {
  label: string;
  support: Record<PlanKey, boolean>;
};

type FeatureSection = {
  key: string;
  title: string;
  rows: FeatureRow[];
};

export type ZippayComparisonPlanProps = {
  title?: string;
  description?: string;
  plans?: Plan[];
  sections?: FeatureSection[];
  defaultOpenKey?: string;
  checkIconSrc?: string;
  xIconSrc?: string;
};

const PLANS_DEFAULT: Plan[] = [
  {
    key: 'basic',
    title: 'Standard',
    subtitle: 'Perfect for Individuals',
    href: '/signup?plan=basic',
  },
  {
    key: 'pro',
    title: 'Professional',
    subtitle: 'Perfect for Growing Business',
    href: '/signup?plan=pro',
    featured: true,
  },
  {
    key: 'enterprise',
    title: 'Custom Plan',
    subtitle: 'Perfect for Large Companies',
    href: '/contact/sales',
  },
];

const SECTIONS_DEFAULT: FeatureSection[] = [
  {
    key: 'payments',
    title: 'Payments',
    rows: [
      {
        label: 'Accepting Online Payments',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Recurring Billing + Subscriptions',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'License key management',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Sell Digital Downloads',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'No-code checkout forms',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Launch your eCommerce Stores',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Discounts + Coupon Codes',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Instant payouts',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Disputes',
        support: { basic: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    key: 'checkout',
    title: 'Checkout',
    rows: [
      {
        label: 'Accepting Online Payments',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Recurring Billing + Subscriptions',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'License key management',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Sell Digital Downloads',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'No-code checkout forms',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Launch your eCommerce Stores',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Discounts + Coupon Codes',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Instant payouts',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Disputes',
        support: { basic: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    key: 'payment-links',
    title: 'Payment Links',
    rows: [
      {
        label: 'Accepting Online Payments',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Recurring Billing + Subscriptions',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'License key management',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Sell Digital Downloads',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'No-code checkout forms',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Launch your eCommerce Stores',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Discounts + Coupon Codes',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Instant payouts',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Disputes',
        support: { basic: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    key: 'connect',
    title: 'Connect',
    rows: [
      {
        label: 'Accepting Online Payments',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Recurring Billing + Subscriptions',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'License key management',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Sell Digital Downloads',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'No-code checkout forms',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Launch your eCommerce Stores',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Discounts + Coupon Codes',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Instant payouts',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Disputes',
        support: { basic: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    key: 'billing',
    title: 'Billing',
    rows: [
      {
        label: 'Accepting Online Payments',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Recurring Billing + Subscriptions',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'License key management',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Sell Digital Downloads',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'No-code checkout forms',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Launch your eCommerce Stores',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Discounts + Coupon Codes',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Instant payouts',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Disputes',
        support: { basic: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    key: 'invoicing',
    title: 'Invoicing',
    rows: [
      {
        label: 'Accepting Online Payments',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Recurring Billing + Subscriptions',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'License key management',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Sell Digital Downloads',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'No-code checkout forms',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Launch your eCommerce Stores',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Discounts + Coupon Codes',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Instant payouts',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Disputes',
        support: { basic: true, pro: true, enterprise: true },
      },
    ],
  },
  {
    key: 'revenue',
    title: 'Revenue Recognition',
    rows: [
      {
        label: 'Accepting Online Payments',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Recurring Billing + Subscriptions',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'License key management',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Sell Digital Downloads',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'No-code checkout forms',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Launch your eCommerce Stores',
        support: { basic: false, pro: false, enterprise: true },
      },
      {
        label: 'Discounts + Coupon Codes',
        support: { basic: false, pro: true, enterprise: true },
      },
      {
        label: 'Instant payouts',
        support: { basic: true, pro: true, enterprise: true },
      },
      {
        label: 'Disputes',
        support: { basic: true, pro: true, enterprise: true },
      },
    ],
  },
];

type FeatureGridProps = {
  rows: FeatureRow[];
  plans: Plan[];
  checkIconSrc?: string;
  xIconSrc?: string;
};

function FeatureGrid({
  rows,
  plans,
  checkIconSrc = '/images/pricing/yes.svg',
  xIconSrc = '/images/pricing/not.svg',
}: FeatureGridProps) {
  return (
    <div className="border-t border-gray-100 dark:border-gray-50">
      <div className="divide-y divide-gray-100">
        {rows.map((row, i) => (
          <div
            key={`row-${i}`}
            className="border-b border-gray-100 px-2 py-3 last:border-b-0 sm:px-3 sm:py-3.5 dark:border-gray-50"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] sm:items-start sm:gap-x-4">
              <div className="text-body-md text-gray-500">{row.label}</div>

              <div className="grid grid-cols-3 gap-4 sm:contents">
                {plans.map((plan) => {
                  const hasIt = row.support[plan.key];
                  const icon = hasIt ? checkIconSrc : xIconSrc;

                  return (
                    <div
                      key={`cell-${i}-${plan.key}`}
                      className="flex items-start justify-start"
                    >
                      <Image
                        src={icon}
                        alt={hasIt ? 'Included' : 'Not included'}
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ZippayComparisonPlan({
  title = 'Comparison Plan',
  description = `Whether you're a small startup or a large enterprise, we offer scalable solutions tailored to meet your financial management requirements`,
  plans = PLANS_DEFAULT,
  sections = SECTIONS_DEFAULT,
  defaultOpenKey = 'payments',
}: ZippayComparisonPlanProps) {
  return (
    <section className="px-6 py-10 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-foreground text-heading-2 tracking-tight lg:text-[44px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mt-3 text-gray-500">
            {description}
          </p>
        </div>

        <div className="mt-10 lg:mt-12">
          <Accordion
            type="single"
            collapsible
            defaultValue={defaultOpenKey}
            className="w-full"
          >
            {sections.map((section) => (
              <AccordionItem
                key={section.key}
                value={section.key}
                className="border-b border-gray-100 first:border-t dark:border-gray-50"
              >
                <AccordionTrigger
                  className={cn(
                    'w-full py-3 text-left sm:py-3.5',
                    'text-body-md-medium sm:text-body-lg-medium',
                    '[&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-gray-900',
                  )}
                >
                  {section.title}
                </AccordionTrigger>

                <AccordionContent className="p-0">
                  <FeatureGrid
                    rows={section.rows}
                    plans={plans}
                    checkIconSrc="/images/pricing/yes.svg"
                    xIconSrc="/images/pricing/not.svg"
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-10 hidden grid-cols-1 gap-6 md:grid lg:mt-12 lg:grid-cols-4">
          <div className="hidden lg:block" aria-hidden="true" />

          {plans.map((p) => (
            <div
              key={p.key}
              className={cn(
                'rounded-2xl border p-5 sm:p-6',
                p.featured
                  ? 'bg-primary-300 border-transparent text-white dark:border-gray-50'
                  : 'bg-gray-25 border-gray-50 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] dark:border-gray-50',
              )}
            >
              <h3
                className={cn(
                  'text-body-lg-bold text-[18px] font-bold',
                  p.featured ? 'text-white' : 'text-foreground',
                )}
              >
                {p.title}
              </h3>
              {!!p.subtitle && (
                <p
                  className={cn(
                    'text-body-sm mt-1',
                    p.featured ? 'text-white/80' : 'text-gray-500',
                  )}
                >
                  {p.subtitle}
                </p>
              )}
              <div className="mt-4">
                <Button
                  asChild
                  variant={p.featured ? 'default' : 'secondary'}
                  className={cn('w-full', p.featured && 'text-gray-900')}
                >
                  <Link href={p.href}>{p.ctaLabel ?? 'Get Started'}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
