'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

type CTAProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  patternSrc?: string;
};

export default function ZippayCtaSection({
  // NEW CONTENT: Focus on getting them to start now
  title = 'Ready to reclaim your time?',
  description = `Join engineering teams that have switched to ArcLogs and stopped wasting hours in meetings.`,
  primaryHref = '/signup',
  primaryLabel = 'Get Started', 
  // secondary props are no longer used
  patternSrc = '/images/homepage/cta/pattern.webp',
}: CTAProps) {
  return (
    <section className="bg-primary-300 relative overflow-hidden px-6 py-10 text-white lg:py-26">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <Image
          src={patternSrc}
          alt=""
          fill
          priority
          className="object-cover opacity-20"
        />
      </div>

      <div className="relative z-10 container text-center">
        <h2 className="text-heading-1 mx-auto max-w-[637px] tracking-tight lg:text-[52px]">
          {title}
        </h2>

        <p className="text-body-md sm:text-body-lg mx-auto mt-5 max-w-3xl text-white">
          {description}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="w-full text-gray-900 sm:w-auto"
            variant="default"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>

          {/* REMOVED: Secondary "See How It Works" Button */}
        </div>
      </div>
    </section>
  );
}