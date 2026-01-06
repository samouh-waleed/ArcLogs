'use client';

import Image from 'next/image';

type BulletItem = {
  iconSrc: string;
  iconAlt?: string;
  title: string;
  description: string;
};

export type ZippayFeatureBulletsProps = {
  tagline?: string;
  title?: string;
  description?: string;
  bullets?: [BulletItem, BulletItem, BulletItem, BulletItem];
  imageSrc?: string;
  imageAlt?: string;
};

export default function ZippayFeatureBullets({
  tagline = 'Benefits',
  title = 'Built to Scale with You',
  description = `Our solution grows seamlessly with your business, adapting to your expanding needs.`,
  bullets = [
    {
      iconSrc: '/images/solutions/bullets/Icon.svg',
      title: 'Completely Flexible',
      description:
        'Adapt our solutions to fit your unique business needs effortlessly',
    },
    {
      iconSrc: '/images/solutions/bullets/Icon.svg',
      title: 'Operate Globally',
      description:
        'Seamlessly manage and expand your business across international borders',
    },
    {
      iconSrc: '/images/solutions/bullets/Icon.svg',
      title: 'Integrate and Stay Signed',
      description:
        'Easily connect with existing systems and maintain secure access',
    },
    {
      iconSrc: '/images/solutions/bullets/Icon.svg',
      title: 'Extension of Your Team',
      description:
        'Enhance your capabilities with our platform acting as your support',
    },
  ],
  imageSrc = '/images/solutions/bullets/b1.webp',
  imageAlt = 'Mobile app previews',
}: ZippayFeatureBulletsProps) {
  return (
    <section className="px-6 py-10 lg:py-24">
      <div className="container grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-body-sm-medium text-primary-200">
            {tagline}
          </span>
          <h2 className="text-foreground text-heading-1 mt-3 tracking-tight lg:text-[52px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mt-3 max-w-2xl text-gray-400">
            {description}
          </p>

          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {bullets.map((b, i) => (
              <div key={i} className="max-w-[480px]">
                <Image
                  src={b.iconSrc}
                  alt={b.iconAlt ?? b.title}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <h3 className="text-body-lg-bold text-foreground mt-4">
                  {b.title}
                </h3>
                <p className="text-body-md mt-2 text-gray-400">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-full w-full">
          <div className="relative mx-auto flex h-full w-full max-w-[680px] items-center justify-center">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={1200}
              height={1000}
              className="h-auto w-full object-contain"
              priority
              sizes="(min-width:1024px) 680px, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
