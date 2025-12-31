'use client';

import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_ICON = '/images/features/tabs/database.svg';

type FeatureItem = {
  key: string;
  label: string;
  caption?: string;
  body: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  buttonLabel?: string;
  iconSrc?: string;
};

export type ZippayFeaturesTabsProps = {
  tagline?: string;
  title?: string;
  description?: string;
  items?: FeatureItem[];
};

const DEFAULT_ITEMS: FeatureItem[] = [
  {
    key: 'eliminate',
    label: 'Eliminate Data Entry',
    body: 'Capture invoices automatically and sync line items into your ledger with zero manual typing.',
    imageSrc: '/images/features/tabs/t1.webp',
    imageAlt: 'Invoice capture',
    href: '/faq',
  },
  {
    key: 'controls',
    label: 'Instantly Strengthen Controls',
    body: 'Detect duplicates, enforce 2-way matches to POs, and route approvals based on advanced rules.',
    imageSrc: '/images/features/tabs/t1.webp',
    imageAlt: 'Controls',
    href: '/faq',
  },
  {
    key: 'never-miss',
    label: 'Never Miss a Bill',
    body: 'Automated reminders and due-date insights keep everything paid on time without the scramble.',
    imageSrc: '/images/features/tabs/t1.webp',
    imageAlt: 'Reminders',
    href: '/faq',
  },
  {
    key: 'any-method',
    label: 'Use Any Vendor Payment Method',
    body: 'ACH, card, international wires—pay vendors the way they want while keeping your process unified.',
    imageSrc: '/images/features/tabs/t1.webp',
    imageAlt: 'Payments',
    href: '/faq',
  },
];

export default function ZippayFeaturesTabs({
  tagline = 'Features',
  title = 'Streamlined AP Software',
  description = 'Simplify accounts payable with intuitive automation, efficient processing, and seamless integration for faster financial management.',
  items = DEFAULT_ITEMS,
}: ZippayFeaturesTabsProps) {
  const [active, setActive] = React.useState(items[0]?.key);
  const current = items.find((i) => i.key === active) ?? items[0];

  return (
    <section className="px-6 py-10 lg:py-24">
      <div className="container">
        <div className="max-w-3xl">
          <span className="text-body-sm-medium text-primary-200">
            {tagline}
          </span>
          <h2 className="text-foreground text-heading-1 mt-3 tracking-tight lg:text-[52px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mt-3 text-gray-400">
            {description}
          </p>
        </div>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div
              role="tablist"
              aria-orientation="vertical"
              className="hidden w-full lg:flex lg:h-full lg:flex-col lg:justify-between"
            >
              <div>
                {items.map((it) => {
                  const isActive = active === it.key;
                  const iconSrc = it.iconSrc ?? DEFAULT_ICON;

                  return (
                    <button
                      key={it.key}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActive(it.key)}
                      className={cn(
                        'w-full border-b py-4 text-left transition-colors',
                        isActive
                          ? 'border-primary border-b-2 text-gray-900'
                          : 'border-gray-100 text-gray-400 hover:text-gray-500',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className={cn(
                            'inline-block size-5',
                            isActive ? 'bg-gray-900' : 'bg-gray-400',
                          )}
                          style={{
                            mask: `url(${iconSrc}) no-repeat center / contain`,
                            WebkitMask: `url(${iconSrc}) no-repeat center / contain`,
                          }}
                        />
                        <span className="text-body-md-medium">{it.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 max-w-prose">
                <p className="text-body-md text-gray-400">{current.body}</p>
                {current.href && (
                  <div className="mt-4">
                    <Button
                      asChild
                      variant="secondary"
                      className="justify-start px-4"
                    >
                      <Link href={current.href}>
                        <span className="mr-2">
                          {current.buttonLabel ?? 'Learn More'}
                        </span>
                        <Image
                          src="/icons/arrow-right.svg"
                          alt=""
                          width={20}
                          height={20}
                          className="h-[20px] w-[20px] dark:invert"
                        />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:hidden">
              {items.map((it) => {
                const open = active === it.key;
                const iconSrc = it.iconSrc ?? DEFAULT_ICON;

                return (
                  <div
                    key={it.key}
                    className={cn(
                      'border-b transition-colors',
                      open ? 'border-primary border-b-2' : 'border-gray-100',
                    )}
                  >
                    <button
                      onClick={() => setActive(it.key)}
                      className={cn(
                        'flex w-full items-center justify-between py-4 text-left',
                        open ? 'text-gray-900' : 'text-gray-400',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className={cn(
                            'inline-block size-5',
                            open ? 'bg-gray-900' : 'bg-gray-400',
                          )}
                          style={{
                            mask: `url(${iconSrc}) no-repeat center / contain`,
                            WebkitMask: `url(${iconSrc}) no-repeat center / contain`,
                          }}
                        />
                        <span className="text-body-md-medium">{it.label}</span>
                      </div>
                    </button>

                    {open && (
                      <div className="pb-4">
                        <p className="text-body-md text-gray-400">{it.body}</p>
                        {it.href && (
                          <div className="mt-4">
                            <Button
                              asChild
                              variant="secondary"
                              className="w-full justify-center sm:w-auto sm:justify-start"
                            >
                              <Link href={it.href}>
                                <span className="mr-2">
                                  {it.buttonLabel ?? 'Learn More'}
                                </span>
                                <Image
                                  src="/icons/arrow-right.svg"
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="h-[20px] w-[20px]"
                                />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="min-w-0">
            <div className="relative mx-auto w-full">
              <Image
                key={current?.imageSrc}
                src={current?.imageSrc ?? ''}
                alt={current?.imageAlt ?? current?.label ?? 'Feature preview'}
                width={1200}
                height={800}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
