'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType, JSX } from 'react';

type NavLink = { name: string; href: string };
type NavSection = { title: string; links: NavLink[] };
type SocialLink = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

export type ZippayFooterProps = {
  brandName?: string;
  brandLogoSrc?: string;
  nav?: NavSection[];
  social?: SocialLink[];
  legal?: NavLink[];
};

const DEFAULT_NAV: NavSection[] = [
  {
    title: 'Product',
    links: [
      { name: 'Feature 1', href: '/feature1' },
      { name: 'Feature 2', href: '/feature2' },
      { name: 'Integrations', href: '/integrations' },
    ],
  },

  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contatct', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '/blog' },
      { name: 'Sign In', href: '/login' },
      { name: 'Sign Up', href: '/signup' },
    ],
  },
];

export const XIcon = ({ className }: { className?: string }) => (
  <Image
    src="/icons/x.svg"
    alt="X"
    width={16}
    height={16}
    className={className}
  />
);

export const YTIcon = ({ className }: { className?: string }) => (
  <Image
    src="/icons/yt.svg"
    alt="YouTube"
    width={16}
    height={16}
    className={className}
  />
);

export const InIcon = ({ className }: { className?: string }) => (
  <Image
    src="/icons/in.svg"
    alt="LinkedIn"
    width={16}
    height={16}
    className={className}
  />
);

const DEFAULT_SOCIAL: SocialLink[] = [
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: InIcon },
  { href: 'https://x.com', label: 'X', icon: XIcon },
  { href: 'https://youtube.com', label: 'YouTube', icon: YTIcon },
];
const DEFAULT_LEGAL: NavLink[] = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
];

export default function Footer({
  brandName = 'Zippay',
  brandLogoSrc = '/images/layout/logo.svg',
  nav = DEFAULT_NAV,
  social = DEFAULT_SOCIAL,
  legal = DEFAULT_LEGAL,
}: ZippayFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary-300 border-t border-white/10 text-white">
      <div className="container px-6 py-12 lg:py-20">
        <div className="grid gap-16 lg:grid-cols-[max-content_1fr] lg:gap-32">
          <div className="col-span-full flex max-w-max flex-col justify-between lg:col-span-1">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src={brandLogoSrc}
                  alt={`${brandName} logo`}
                  width={129}
                  height={32}
                  className="invert dark:invert"
                />
                <span className="sr-only">{brandName}</span>
              </Link>

              <p className="text-body-sm mt-3 text-white/70">
                {brandName} Technologies, LLC {year}
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-body-sm text-white/70">Follow us on:</p>
              <div className="flex items-center gap-2">
                {social.map((s) => {
                  const Icon = s.icon ?? (() => null as unknown as JSX.Element);
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      aria-label={s.label}
                      className="bg-gray-0/10 hover:bg-gray-0/20 inline-flex size-9 items-center justify-center rounded-md border border-white/10 shadow-[0_1px_2px_0_rgba(13,13,18,0.06)] backdrop-blur-[2px] transition"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon className="size-4" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navs: auto-fit 2 cols on mobile (falls to 1 when needed), 4 cols on lg */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-8 lg:grid-cols-3">
            {nav.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="text-body-md-medium text-white/80">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((l) => (
                    <li key={l.name}>
                      <Link
                        href={l.href}
                        className="text-body-md text-white/90 transition hover:text-white"
                      >
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row lg:mt-24">
          <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legal.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="text-body-sm text-white/80 transition hover:text-white"
              >
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
