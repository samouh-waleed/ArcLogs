'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ZippayCtaCardProps = {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  softBg?: boolean;
};

export default function ZippayCtaCard({
  title = 'Ready to reclaim your time?',
  description = 'Join engineering teams that have switched to Arc Logs and stopped wasting hours in daily meetings.',
  primaryLabel = 'Get Started',
  primaryHref = 'https://app.arclogs.com/signup',
  // secondaryLabel = 'Why Arc Logs?',
  // secondaryHref = '#how-it-works',
  softBg,
}: ZippayCtaCardProps) {
  return (
    <section
      className={cn(
        'px-6 py-10 lg:py-24',
        softBg && 'bg-gray-25 dark:bg-gray-200',
      )}
    >
      <div className="container">
        {/* Changed bg-primary-300 (green) to bg-blue-900 (brand dark blue) */}
        <div className="rounded-[24px] bg-[#001f3f] px-6 py-12 text-white shadow-xl lg:rounded-[28px] lg:py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <h2 className="text-heading-1 max-w-[637px] leading-tight tracking-tight text-white">
              {title}
            </h2>
            <p className="text-body-md sm:text-body-lg mx-auto mt-4 max-w-2xl text-white/80">
              {description}
            </p>
            <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="w-full border-none bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                variant="default"
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              {/* <Button
                asChild
                variant="translucent"
                className="w-full border-white/20 hover:bg-white/10 sm:w-auto"
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
