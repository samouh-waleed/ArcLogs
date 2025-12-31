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
  title = 'A Better Way to Manage Your Money',
  description = 'Zippay enables you to achieve clarity and significant results on a large scale by linking tasks and workflows to the overarching objectives of the company',
  primaryLabel = 'Get Started',
  primaryHref = '/pricing',
  secondaryLabel = 'Why Zippay',
  secondaryHref = '/faq',
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
        <div className="bg-primary-300 rounded-[24px] px-6 py-12 text-white shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] lg:rounded-[28px] lg:py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
            <h2 className="text-heading-1 max-w-[637px] tracking-tight">
              {title}
            </h2>
            <p className="text-body-md sm:text-body-lg mx-auto mt-4 max-w-3xl text-white/80">
              {description}
            </p>
            <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="w-full text-gray-900 sm:w-auto"
                variant="default"
              >
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
              <Button
                asChild
                variant="translucent"
                className="w-full sm:w-auto"
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
