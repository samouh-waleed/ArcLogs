'use client';

import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

import { cn } from '@/lib/utils';

type FaqCategory = {
  title: string;
  description: string;
  iconSrc: string;
  href?: string;
};

export type ZippayFaqPageProps = {
  tagline?: string;
  title?: string;
  description?: string;
  categories?: FaqCategory[];
  className?: string;
};

const DEFAULT_CATEGORIES: FaqCategory[] = [
  {
    title: 'For External Workers',
    description:
      'Find answers to common questions about working with us as an external contractor',
    iconSrc: '/images/faq/f1.svg',
  },
  {
    title: 'For Companies',
    description:
      'Get information on how our services can benefit your company and its operations',
    iconSrc: '/images/faq/f2.svg',
  },
  {
    title: 'Staffing Agencies',
    description:
      'Learn about our partnerships and how staffing agencies can collaborate with us',
    iconSrc: '/images/faq/f3.svg',
  },
  {
    title: 'Integrations',
    description:
      'Discover how to integrate our platform with other tools and systems you use',
    iconSrc: '/images/faq/f4.svg',
  },
  {
    title: 'Build Related',
    description:
      'Explore frequently asked questions about building and customizing your solutions with us',
    iconSrc: '/images/faq/f5.svg',
  },
  {
    title: 'Promoted Related',
    description:
      'Understand how our promotion options work and how they can enhance your visibility',
    iconSrc: '/images/faq/f6.svg',
  },
  {
    title: 'Manage Related',
    description:
      'Get insights into managing your account and utilizing our platform’s features effectively',
    iconSrc: '/images/faq/f7.svg',
  },
  {
    title: 'Legal Questions',
    description:
      'Find answers to common legal questions and concerns related to our services and policies',
    iconSrc: '/images/faq/f8.svg',
  },
];

export default function ZippayFaqPage({
  tagline = 'FAQs',
  title = 'Frequently Asked Questions',
  description = 'Explore common inquiries and find answers to help you navigate and make the most of our services',
  categories = DEFAULT_CATEGORIES,
  className,
}: ZippayFaqPageProps) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [query, categories]);

  return (
    <section className={cn('w-full', className)}>
      <div className="bg-primary-300 px-6 py-14 text-white lg:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-body-xs-medium bg-gray-0/10 inline-flex h-7 items-center rounded-[10px] border border-white/15 px-3 text-white/90 shadow-[0_1px_2px_0_rgba(13,13,18,0.06)] backdrop-blur-[2px]">
              {tagline}
            </span>

            <h1 className="mt-4 text-5xl leading-[1.08] font-bold tracking-tight text-balance sm:text-6xl">
              {title}
            </h1>
            <p className="text-body-lg mx-auto mt-4 max-w-2xl text-white/80">
              {description}
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Image
                    src="/images/faq/search.svg"
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </div>

                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="bg-gray-0/10 h-12 w-full rounded-[14px] border border-white/15 pr-4 pl-10 text-white ring-0 outline-none placeholder:text-white/70 focus:border-white/25"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-0 px-6 py-10 lg:py-16 dark:bg-gray-200">
        <div className="container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((card, i) => {
              const CardInner = (
                <div className="bg-gray-25 rounded-2xl border border-gray-50 p-5 sm:p-6">
                  <div className="flex flex-col items-start gap-4">
                    <Image
                      src={card.iconSrc || '/icons/placeholder.svg'}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11"
                    />
                    <h3 className="text-heading-4 text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-body-lg mt-1 text-gray-500">
                      {card.description}
                    </p>
                  </div>
                </div>
              );

              return card.href ? (
                <Link key={i} href={card.href} className="group">
                  {CardInner}
                </Link>
              ) : (
                <div key={i}>{CardInner}</div>
              );
            })}

            {filtered.length === 0 && (
              <div className="bg-gray-0 col-span-full rounded-2xl border border-gray-100 p-6 text-center text-gray-500">
                No results found for “{query}”.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
