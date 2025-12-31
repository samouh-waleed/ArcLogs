'use client';

import Image from 'next/image';

type Testimonial = {
  name: string;
  role: string;
  avatarSrc: string;
  companyLogoSrc: string;
  companyLogoAlt?: string;
  companyLogoWidth?: number;
  companyLogoHeight?: number;
  quote: string;
  tags: string[];
};

export type ZippayTestimonialsSectionProps = {
  tagline?: string;
  title?: string;
  subtitle?: string;
  items?: Testimonial[];
};

const DEFAULT_ITEMS: Testimonial[] = [
  {
    name: 'Alex Bergwijn',
    role: 'Accounting at Amazon',
    avatarSrc: '/images/homepage/testimonials/alex.webp',
    companyLogoSrc: '/images/homepage/testimonials/amazon.svg',
    companyLogoAlt: 'Amazon',
    companyLogoWidth: 80,
    companyLogoHeight: 24,
    quote:
      'Zippay revolutionized our financial management with its easy-to-use interface. The global card and expense controls streamlined our processes, saving us both time and money.',
    tags: ['Software & Technology', 'Mid-Size'],
  },
  {
    name: 'Arlene McCoy',
    role: 'Accounting at Square',
    avatarSrc: '/images/homepage/testimonials/arlene.webp',
    companyLogoSrc: '/images/homepage/testimonials/square.svg',
    companyLogoAlt: 'Square',
    companyLogoWidth: 82,
    companyLogoHeight: 24,
    quote:
      'The flexibility and efficiency of their platform have significantly improved our financial operations. A game-changer for our business!',
    tags: ['Software & Technology', 'Mid-Size'],
  },
  {
    name: 'Robert Fox',
    role: 'Accounting at Evernote',
    avatarSrc: '/images/homepage/testimonials/robert.webp',
    companyLogoSrc: '/images/homepage/testimonials/evernote.svg',
    companyLogoAlt: 'Evernote',
    companyLogoWidth: 92,
    companyLogoHeight: 24,
    quote:
      "Managing global payments used to be a hassle, but Zippay made it straightforward. The platform's flexibility and intuitive design have been perfect for our expanding needs.",
    tags: ['Software & Technology', 'Mid-Size'],
  },
  {
    name: 'Dianne Russell',
    role: 'Accounting at Shopify',
    avatarSrc: '/images/homepage/testimonials/dianne.webp',
    companyLogoSrc: '/images/homepage/testimonials/shopify.svg',
    companyLogoAlt: 'Shopify',
    companyLogoWidth: 84,
    companyLogoHeight: 24,
    quote:
      'Zippay’s global corporate card has simplified our international transactions. The ease of use and flexibility in managing expenses have been crucial for our global operations.',
    tags: ['Software & Technology', 'Mid-Size'],
  },
];

export default function ZippayTestimonialsSection({
  tagline = 'Testimonials',
  title = 'What Customer Says',
  subtitle = 'See how 25k+ teams are building healthier businesses',
  items = DEFAULT_ITEMS,
}: ZippayTestimonialsSectionProps) {
  return (
    <section id="zippay-testimonials" className="px-6 py-10 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-body-xs-medium bg-gray-0 inline-flex h-8 items-center gap-2 rounded-[10px] border border-gray-100 px-3 py-0 leading-none shadow-[0_1px_2px_0_rgba(13,13,18,0.06)]">
            <Image
              src="/images/homepage/features/elipse.svg"
              alt="status"
              width={6}
              height={6}
              className="h-[6px] w-[6px]"
            />
            {tagline}
          </span>

          <h2 className="text-foreground text-heading-1 mt-4 tracking-tight lg:text-[52px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mx-auto mt-4 max-w-2xl text-gray-400">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2">
          {items.map((t, i) => (
            <article
              key={i}
              className="bg-gray-0 rounded-[24px] border border-gray-50 p-6 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] md:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={t.avatarSrc}
                    alt={t.name}
                    width={48}
                    height={48}
                    className="size-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-body-sm-bold text-foreground">
                      {t.name}
                    </div>
                    <div className="text-body-sm text-gray-400">{t.role}</div>
                  </div>
                </div>

                <Image
                  src={t.companyLogoSrc}
                  alt={t.companyLogoAlt ?? t.name}
                  width={t.companyLogoWidth ?? 80}
                  height={t.companyLogoHeight ?? 24}
                  className="h-auto w-auto opacity-70"
                />
              </div>

              <p className="text-body-lg text-foreground mt-8">“{t.quote}”</p>

              {!!t.tags?.length && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {t.tags.map((tag, k) => (
                    <span
                      key={k}
                      className="text-body-xs-medium bg-gray-25 inline-flex h-8 items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
