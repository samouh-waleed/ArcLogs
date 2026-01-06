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
      { name: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      // { name: 'FAQ', href: '/faq' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
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
  brandName = 'ArcLogs',
  brandLogoSrc = '/images/layout/white_logo.jpg',
  nav = DEFAULT_NAV,
  // social and legal props are no longer needed in the render
}: ZippayFooterProps) {
  // Removed "year" variable as it's no longer used

  return (
    <footer className="bg-primary-300 border-t border-white/10 text-white">
      <div className="container px-6 py-12 lg:py-20">
        <div className="grid gap-16 lg:grid-cols-[max-content_1fr] lg:gap-32">
          
          {/* LEFT COLUMN: Logo Only */}
          <div className="col-span-full flex max-w-max flex-col justify-between lg:col-span-1">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src={brandLogoSrc}
                  alt={`${brandName} logo`}
                  width={129}
                  height={32}
                  // className="invert dark:invert"
                />
                <span className="sr-only">{brandName}</span>
              </Link>
              {/* REMOVED: Copyright text */}
            </div>

            {/* REMOVED: "Follow us on" and social icons */}
          </div>

          {/* RIGHT COLUMN: Navigation Links */}
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

        {/* REMOVED: Bottom Legal Links (Privacy/Terms) section */}
      </div>
    </footer>
  );
}