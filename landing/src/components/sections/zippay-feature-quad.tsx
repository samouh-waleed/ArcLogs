'use client';

import Image from 'next/image';
import * as React from 'react';

import { cn } from '@/lib/utils';

type FeatureItem = {
  iconSrc: string;
  iconAlt?: string;
  title: string;
  description: string;
};

export type ZippayFeatureQuadProps = {
  featureImageSrcs?: [string, string, string, string];
  centerImageAlt?: string;
  features?: [FeatureItem, FeatureItem, FeatureItem, FeatureItem];
};

export default function ZippayFeatureQuad({
  featureImageSrcs = [
    '/images/homepage/features/quad1.webp',
    '/images/homepage/features/quad2.webp',
    '/images/homepage/features/quad3.webp',
    '/images/homepage/features/quad4.webp',
  ],
  centerImageAlt = 'Card & phone preview',
  features = [
    {
      iconSrc: '/icons/globe.svg',
      title: 'Operate Globally',
      description:
        'Seamlessly manage and expand your business across international borders',
    },
    {
      iconSrc: '/icons/stack.svg',
      title: 'Completely Flexible',
      description:
        'Adapt our solutions to fit your unique business needs effortlessly',
    },
    {
      iconSrc: '/icons/apps.svg',
      title: 'Integrate and Stay Signed',
      description:
        'Easily connect with existing systems and maintain secure access',
    },
    {
      iconSrc: '/icons/user.svg',
      title: 'Extension of Your Team',
      description:
        'Enhance your capabilities with our platform acting as your support',
    },
  ],
}: ZippayFeatureQuadProps) {
  const [active, setActive] = React.useState(0);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActive((a) => (a + 1) % 4);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActive((a) => (a + 3) % 4);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(3);
    }
  };

  const cellBase =
    'w-full max-w-[640px] mx-auto text-center transition-colors focus:outline-none py-4';
  const innerBase =
    'rounded-xl px-4 py-6 flex flex-col items-center justify-center ring-inset focus-visible:ring-2 focus-visible:ring-primary/40';
  const iconWrap =
    'bg-gray-0 mb-6 flex size-13 items-center justify-center rounded-full border border-gray-100 shadow-[0_1px_2px_0_rgba(13,13,18,0.06)]';

  const left = features.slice(0, 2);
  const right = features.slice(2, 4);

  return (
    <section className="px-6 py-10 lg:py-24">
      <div className="container">
        <div className="bg-gray-0 overflow-hidden rounded-[28px] border border-gray-50 px-6 py-10 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] lg:px-8">
          <div
            className="flex flex-col items-center gap-4 lg:gap-6"
            role="tablist"
            aria-label="Feature list"
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            tabIndex={0}
          >
            <div className="flex w-full flex-col items-center gap-4 lg:hidden">
              {features.map((f, i) => {
                const selected = active === i;
                return (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`feature-panel-${i}`}
                    id={`feature-tab-${i}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={cellBase}
                  >
                    <div
                      className={cn(
                        innerBase,
                        selected
                          ? 'bg-gray-25 border border-gray-50 dark:bg-gray-100'
                          : 'border border-transparent bg-transparent',
                      )}
                    >
                      <div className={iconWrap}>
                        <Image
                          src={f.iconSrc}
                          alt={f.iconAlt ?? f.title}
                          width={36}
                          height={36}
                          className="h-9 w-9"
                        />
                      </div>
                      <h3 className="text-body-lg-bold text-foreground">
                        {f.title}
                      </h3>
                      <p className="text-body-md mt-2 text-gray-400">
                        {f.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="hidden w-full items-center justify-items-center gap-16 lg:grid lg:grid-cols-[1fr_auto_1fr]">
              <div className="w-full divide-y divide-gray-50">
                {left.map((f, idx) => {
                  const i = idx;
                  const selected = active === i;
                  return (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`feature-panel-${i}`}
                      id={`feature-tab-${i}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActive(i)}
                      className="w-full max-w-[336px] py-4 text-center transition-colors focus:outline-none"
                    >
                      <div
                        className={cn(
                          'focus-visible:ring-primary/40 m-px flex flex-col items-center justify-center rounded-xl px-4 py-6 ring-inset focus-visible:ring-2',
                          selected
                            ? 'bg-gray-25 border border-gray-50 dark:bg-gray-100'
                            : 'border border-transparent bg-transparent',
                        )}
                      >
                        <div className={iconWrap}>
                          <Image
                            src={f.iconSrc}
                            alt={f.iconAlt ?? f.title}
                            width={36}
                            height={36}
                            className="h-9 w-9"
                          />
                        </div>
                        <h3 className="text-body-lg-bold text-foreground">
                          {f.title}
                        </h3>
                        <p className="text-body-md mt-2 text-gray-400">
                          {f.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="hidden justify-center lg:flex">
                <Image
                  key={featureImageSrcs[active]}
                  src={featureImageSrcs[active]}
                  alt={`${features[active]?.title ?? centerImageAlt}`}
                  width={520}
                  height={520}
                  className="h-auto max-w-[520px]"
                  priority={active === 0}
                />
              </div>

              <div className="w-full divide-y divide-gray-50">
                {right.map((f, idx) => {
                  const i = idx + 2;
                  const selected = active === i;
                  return (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`feature-panel-${i}`}
                      id={`feature-tab-${i}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActive(i)}
                      className="w-full max-w-[336px] py-4 text-center transition-colors focus:outline-none"
                    >
                      <div
                        className={cn(
                          'focus-visible:ring-primary/40 m-px flex flex-col items-center justify-center rounded-xl px-4 py-6 ring-inset focus-visible:ring-2',
                          selected
                            ? 'bg-gray-25 border border-gray-50 dark:bg-gray-100'
                            : 'border border-transparent bg-transparent',
                        )}
                      >
                        <div className={iconWrap}>
                          <Image
                            src={f.iconSrc}
                            alt={f.iconAlt ?? f.title}
                            width={36}
                            height={36}
                            className="h-9 w-9"
                          />
                        </div>
                        <h3 className="text-body-lg-bold text-foreground">
                          {f.title}
                        </h3>
                        <p className="text-body-md mt-2 text-gray-400">
                          {f.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex w-full justify-center lg:hidden">
              <Image
                key={featureImageSrcs[active]}
                src={featureImageSrcs[active]}
                alt={`${features[active]?.title ?? centerImageAlt}`}
                width={1200}
                height={1200}
                className="h-auto w-full"
                priority={active === 0}
                sizes="100vw"
              />
            </div>

            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                id={`feature-panel-${i}`}
                role="tabpanel"
                aria-labelledby={`feature-tab-${i}`}
                hidden={active !== i}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
