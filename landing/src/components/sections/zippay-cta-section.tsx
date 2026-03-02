'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

type CTAProps = {
  title?: string;
  description?: string;
  patternSrc?: string;
};

export default function ZippayCtaSection({
  title = 'Ready to reclaim your time?',
  description = `Join engineering teams that have switched to ArcLogs and stopped wasting hours in meetings.`,
  patternSrc = '/images/homepage/cta/pattern.webp',
}: CTAProps) {
  return (
    <section
      id="cta"
      className="bg-primary-300 relative overflow-hidden px-6 py-10 text-white lg:py-26"
    >
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

        <div className="mx-auto mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="w-full bg-white text-gray-900 hover:bg-gray-100 sm:w-auto"
          >
            <Link href="https://app.arclogs.com/signup">Get Started Free</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
          >
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
