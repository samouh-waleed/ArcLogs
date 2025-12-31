'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import ContentIllustration from './content-illustration1';
import ContentIllustration2 from './content-illustration2';

type ContentItem = {
  tagline: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  buttonLabel?: string;
  align?: 'left' | 'right';
};

export type ZippayContentsSectionProps = {
  items?: ContentItem[];
};

const DEFAULT_ITEMS: ContentItem[] = [
  {
    tagline: 'Platform',
    title: 'Set Limits to Prevent Overspending',
    description:
      'Stay in policy and on budget with proactive policy controls, configurable approvals, and AI-powered reconciliation',
    imageSrc: '/images/homepage/contents/contents-1.webp',
    imageAlt: 'Card and spend widgets',
    href: '/features',
    buttonLabel: 'Learn More',
    align: 'left',
  },
  {
    tagline: 'Intelligence',
    title: 'Spend Smarter, Save Every Time',
    description:
      'Use instant insights to get the best price on software, stop redundant spend before it happens, and make every dollar go further',
    imageSrc: '/images/homepage/contents/contents-2.webp',
    imageAlt: 'Analytics dashboard',
    href: '/features',
    buttonLabel: 'Learn More',
    align: 'right',
  },
];

export default function ZippayContentsSection({
  items = DEFAULT_ITEMS,
}: ZippayContentsSectionProps) {
  return (
    <section id="zippay-contents" className="px-6 py-10 lg:py-24">
      <div className="container space-y-24">
        {items.map((item, i) => {
          const imageBlock = (
            <div className="min-w-0">
              <div className="relative mx-auto w-full max-w-[560px]">
                {i === 0 ? (
                  <ContentIllustration
                    className="h-auto w-full"
                    inViewAmount={0.9}
                    x={60}
                    duration={0.6}
                    delayStep={0.2}
                    startDelay={0.3}
                    once={true}
                  />
                ) : (
                  <ContentIllustration2
                    className="h-auto w-full"
                    inViewAmount={0.9}
                    x={60}
                    duration={0.6}
                    delayStep={0.2}
                    startDelay={0.3}
                    once={true}
                  />
                )}
              </div>
            </div>
          );

          const textBlock = (
            <div className="max-w-[616px]">
              <span className="text-body-xs-medium bg-gray-0 inline-flex h-8 items-center gap-2 rounded-[10px] border border-gray-100 px-3 py-0 leading-none shadow-[0_1px_2px_0_rgba(13,13,18,0.06)]">
                <Image
                  src="/images/homepage/features/elipse.svg"
                  alt="elipse"
                  width={6}
                  height={6}
                  className="h-[6px] w-[6px]"
                />
                {item.tagline}
              </span>

              <h2 className="text-foreground text-heading-1 mt-4 tracking-tight lg:text-[52px]">
                {item.title}
              </h2>

              <p className="text-body-md sm:text-body-lg mt-4 max-w-prose text-gray-400">
                {item.description}
              </p>

              {item.href && (
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    asChild
                    className="w-full sm:w-auto"
                  >
                    <Link href={item.href}>
                      <span className="mr-2">
                        {item.buttonLabel ?? 'Learn More'}
                      </span>
                      <Image
                        src="/icons/arrow-right.svg"
                        alt="elipse"
                        width={20}
                        height={20}
                        className="h-[20px] w-[20px] dark:invert"
                      />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          );

          const reversed = item.align === 'right';

          return (
            <div
              key={i}
              className={cn(
                'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
              )}
            >
              <div className={cn('order-1', reversed && 'lg:order-2')}>
                {textBlock}
              </div>

              <div className={cn('order-2', reversed && 'lg:order-1')}>
                {imageBlock}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
