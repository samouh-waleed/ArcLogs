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

export type ZippayFeaturesHeroProps = {
  tagline?: string;
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
  logos?: LogoItem[];
};

const DEFAULT_LOGOS: LogoItem[] = [
  {
    name: 'Notion',
    src: '/images/about/logos/cl1.svg',
    width: 117,
    height: 44,
    href: 'https://www.notion.so',
    className: 'h-[28px] w-[76px] sm:h-[44px] sm:w-[117px]',
  },
  {
    name: 'Mailchimp',
    src: '/images/about/logos/cl2.svg',
    width: 154,
    height: 44,
    href: 'https://mailchimp.com',
    className: 'h-[28px] w-[100px] sm:h-[44px] sm:w-[154px]',
  },
  {
    name: 'Airtable',
    src: '/images/about/logos/cl3.svg',
    width: 140,
    height: 44,
    href: 'https://airtable.com',
    className: 'h-[28px] w-[91px] sm:h-[44px] sm:w-[140px]',
  },
  {
    name: 'Evernote',
    src: '/images/about/logos/cl4.svg',
    width: 150,
    height: 44,
    href: 'https://gumroad.com',
    className: 'h-[28px] w-[92px] sm:h-[44px] sm:w-[150px]',
  },
  {
    name: 'Gumroad',
    src: '/images/about/logos/cl5.svg',
    width: 151,
    height: 44,
    href: 'https://gumroad.com',
    className: 'h-[28px] w-[94px] sm:h-[44px] sm:w-[151px]',
  },
];

export default function ZippayAboutHero({
  tagline = 'About Us',
  title = 'AI Enhancing Work Efficiency',
  description = `Zippay Bill Pay automates your entire accounts payable workflow so every bill is recorded, approved, and paid without any data entry or repetitive tasks`,
  primaryHref = '/pricing',
  primaryLabel = 'Get Started',
  secondaryHref = '/faq',
  secondaryLabel = 'Why Zippay',
  imageSrc = '/images/about/1.webp',
  imageAlt = 'New invoice UI',
  logos = DEFAULT_LOGOS,
}: ZippayFeaturesHeroProps) {
  return (
    <section className="bg-primary-300 px-6 py-10 lg:py-24">
      <div className="container">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-body-xs-medium bg-gray-0/10 inline-flex h-7 items-center rounded-[10px] border border-white/15 px-3 text-center text-white/90 shadow-[0_1px_2px_0_rgba(13,13,18,0.06)] backdrop-blur-[2px]">
              {tagline}
            </span>

            <h1 className="text-heading-1 mt-4 max-w-[680px] tracking-tight text-white lg:text-[68px] lg:leading-[125%]">
              {title}
            </h1>
          </div>

          <div className="max-w-xl lg:pt-10">
            <p className="text-body-md sm:text-body-lg text-white">
              {description}
            </p>

            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button asChild className="w-full sm:w-auto">
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

        <div className="relative mt-10 lg:mt-16">
          <div className="relative w-full">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1600}
              height={900}
              sizes="100vw"
              style={{ width: '100%', height: 'auto' }}
              className="rounded-[8px] object-contain sm:rounded-2xl"
              priority
            />
          </div>
        </div>

        <div className="mt-10 lg:mt-14">
          <p className="text-body-sm text-center text-white">
            Trusted by 25K+ Businesses Teams
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-6 opacity-80 sm:gap-x-10 sm:gap-y-10 lg:justify-between">
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
                  className="flex shrink-0 items-center p-2"
                  aria-label={logo.name}
                >
                  {img}
                </Link>
              ) : (
                <span
                  key={logo.name}
                  className="flex shrink-0 items-center p-2"
                >
                  {img}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
