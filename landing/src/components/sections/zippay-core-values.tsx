'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

type ValueItem = {
  iconSrc: string; // path from /public (e.g. /icons/shield.svg)
  title: string;
  description: string;
};

export type ZippayCoreValuesProps = {
  tagline?: string;
  title?: string;
  description?: string; // optional small blurb under the title
  items?: ValueItem[];
  className?: string;
};

const DEFAULT_VALUES: ValueItem[] = [
  {
    iconSrc: '/images/about/values/cv1.svg',
    title: 'Trust & Security',
    description:
      'We safeguard customer data and earn trust with rigorous controls and transparent practices.',
  },
  {
    iconSrc: '/images/about/values/cv2.svg',
    title: 'Speed with Quality',
    description:
      'We ship quickly without compromising reliability or user experience.',
  },
  {
    iconSrc: '/images/about/values/cv3.svg',
    title: 'Customer-First',
    description:
      'We obsess over real problems and measure success by customer outcomes.',
  },
  {
    iconSrc: '/images/about/values/cv4.svg',
    title: 'Simplicity',
    description:
      'We reduce complexity so teams can focus on the work that matters.',
  },
  {
    iconSrc: '/images/about/values/cv5.svg',
    title: 'Ownership',
    description:
      'We take initiative, own the details, and follow through to the final mile.',
  },
  {
    iconSrc: '/images/about/values/cv6.svg',
    title: 'Collaboration',
    description:
      'We win together—sharing context, feedback, and respect across functions.',
  },
];

export default function ZippayCoreValues({
  tagline = 'Values',
  title = 'Core Values',
  description,
  items = DEFAULT_VALUES,
  className,
}: ZippayCoreValuesProps) {
  return (
    <section className={cn('px-6 py-10 lg:py-24', className)}>
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl text-left">
          <span className="text-body-sm-medium text-primary-200">
            {tagline}
          </span>
          <h2 className="text-heading-1 text-foreground mt-3 tracking-tight lg:text-[52px]">
            {title}
          </h2>
          {!!description && (
            <p className="text-body-md sm:text-body-lg mt-3 text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-0 rounded-2xl border border-gray-100 p-5 sm:p-6"
            >
              <div className="flex flex-col items-start gap-4">
                <Image
                  src={item.iconSrc}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11"
                />

                <h3 className="text-body-lg-medium text-foreground">
                  {item.title}
                </h3>
                <p className="text-body-md mt-1 text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
