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
    src: '/images/homepage/logos/cl1.svg',
    width: 117,
    height: 44,
    href: 'https://www.notion.so',
    className: 'h-[28px] w-[76px] sm:h-[44px] sm:w-[117px]',
  },
  {
    name: 'Mailchimp',
    src: '/images/homepage/logos/cl2.svg',
    width: 154,
    height: 44,
    href: 'https://mailchimp.com',
    className: 'h-[28px] w-[100px] sm:h-[44px] sm:w-[154px]',
  },
  {
    name: 'Airtable',
    src: '/images/homepage/logos/cl3.svg',
    width: 140,
    height: 44,
    href: 'https://airtable.com',
    className: 'h-[28px] w-[91px] sm:h-[44px] sm:w-[140px]',
  },
  {
    name: 'Evernote',
    src: '/images/homepage/logos/cl6.svg',
    width: 150,
    height: 44,
    href: 'https://gumroad.com',
    className: 'h-[28px] w-[92px] sm:h-[44px] sm:w-[150px]',
  },
  {
    name: 'Gumroad',
    src: '/images/homepage/logos/cl5.svg',
    width: 151,
    height: 44,
    href: 'https://gumroad.com',
    className: 'h-[28px] w-[94px] sm:h-[44px] sm:w-[151px]',
  },
];

export default function ZippayLogos({
  logos = DEFAULT_LOGOS,
}: ZippayFeaturesHeroProps) {
  return (
    <section className="bg-gray-25 px-6 py-8 lg:py-20 dark:bg-gray-200">
      <div className="container">
        <p className="text-body-sm text-center text-gray-500">
          Trusted by 25K+ Businesses Teams
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-6 opacity-80 sm:gap-x-10 sm:gap-y-10 md:mt-14 lg:justify-between">
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
              <span key={logo.name} className="flex shrink-0 items-center p-2">
                {img}
              </span>
            );
          })}
        </div>
        <div className="mt-6 flex w-full items-center justify-center md:mt-14">
          <Button
            asChild
            variant="secondary"
            className="flex w-full items-center justify-center px-4 sm:w-auto"
          >
            <Link href="#">
              <span className="mr-2">View Customer Stories</span>
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
      </div>
    </section>
  );
}
