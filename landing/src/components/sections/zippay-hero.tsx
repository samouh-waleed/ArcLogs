'use client';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LogoItem = {
  name: string;
  src: string;
  width: number;
  height: number;
  href?: string;
  className?: string;
};

export type ZippayHeroProps = {
  logos?: LogoItem[];
};

const DEFAULT_LOGOS: LogoItem[] = [
  {
    name: 'Notion',
    src: '/images/homepage/logos/cl1.svg',
    width: 90,
    height: 34,
    href: 'https://www.notion.so',
    className: 'h-[20px] w-[53px] sm:h-[34px] sm:w-[90px]',
  },
  {
    name: 'Mailchimp',
    src: '/images/homepage/logos/cl2.svg',
    width: 119,
    height: 34,
    href: 'https://mailchimp.com',
    className: 'h-[20px] w-[70px] sm:h-[34px] sm:w-[119px]',
  },
  {
    name: 'Airtable',
    src: '/images/homepage/logos/cl3.svg',
    width: 108,
    height: 34,
    href: 'https://airtable.com',
    className: 'h-[20px] w-[64px] sm:h-[34px] sm:w-[108px]',
  },
  {
    name: 'Gumroad',
    src: '/images/homepage/logos/cl4.svg',
    width: 105,
    height: 34,
    href: 'https://gumroad.com',
    className: 'h-[20px] w-[62px] sm:h-[34px] sm:w-[105px]',
  },
];

export default function ZippayHero({ logos = DEFAULT_LOGOS }: ZippayHeroProps) {
  return (
    <section
      id="zippay-hero"
      className="bg-background relative min-h-[640px] overflow-hidden px-6"
    >
      <div
        className="bg-primary-300 absolute inset-y-0 right-0 z-0 hidden overflow-hidden lg:block"
        style={{
          left: 'max(0px, calc((100vw - 1200px) / 2 + 780px))',
        }}
      />
      <div className="relative z-10">
        <div className="relative container">
          <div className="grid pt-10 lg:[grid-template-columns:minmax(0,1fr)_clamp(420px,40vw,480px)] lg:gap-16 lg:py-24">
            <div className="flex flex-col justify-between gap-8 pb-6">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col items-start gap-4">
                  <span className="text-body-sm-medium bg-gray-0 inline-flex h-8 w-fit items-center justify-center gap-2 rounded-[10px] border border-gray-100 px-3 leading-none whitespace-nowrap shadow-[0_1px_2px_0_rgba(13,13,18,0.06)]">
                    <Image
                      src="/images/homepage/features/elipse.svg"
                      alt="elipse"
                      width={6}
                      height={6}
                      className="h-[6px] w-[6px]"
                    />
                    Wealth Management
                  </span>

                  <h1 className="text-foreground text-heading-1 leading-[1.05] font-bold tracking-tight lg:text-[68px] lg:leading-[125%]">
                    Enhance Your Financial Efficiency
                  </h1>

                  <p className="text-body-lg max-w-xl text-gray-400">
                    Easy-to-use cards, spend limits, approval flows, vendor
                    payments, and more plus an average savings of 5%
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button
                    asChild
                    className="w-full sm:w-auto"
                    aria-label="Get Started"
                  >
                    <Link href="/pricing">Get Started</Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full sm:w-auto"
                    aria-label="Why Zippay"
                  >
                    <Link href="/faq">Why Zippay</Link>
                  </Button>
                </div>
              </div>

              <div className="md-gap-8 flex flex-col gap-4">
                <p className="text-sm text-gray-400">
                  Trusted by 25K+ businesses teams
                </p>

                <div className="flex w-full flex-wrap items-center justify-between gap-y-4 opacity-80">
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
                        className="flex items-center p-2"
                        aria-label={logo.name}
                      >
                        {img}
                      </Link>
                    ) : (
                      <span key={logo.name} className="flex items-center p-2">
                        {img}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="relative">
                <div className="bg-primary-300 absolute inset-y-0 left-1/2 z-0 w-screen -translate-x-1/2 lg:hidden" />

                <div className="relative z-10 flex w-full justify-center py-6 lg:justify-start lg:py-0">
                  <Image
                    src="/images/homepage/zippay-hero-image.webp"
                    alt="Zippay dashboard preview"
                    width={480}
                    height={485}
                    priority
                    className="block h-auto w-full max-w-none [filter:drop-shadow(0_8px_20px_rgba(0,0,0,0.06))_drop-shadow(0_24px_48px_rgba(0,0,0,0.05))] lg:max-w-[480px]"
                    sizes="(min-width:1024px) 480px, 100vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
