'use client';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  avatarSrc: string;
  twitter?: string;
  href?: string;
};

export type ZippayTeamMembersProps = {
  tagline?: string;
  title?: string;
  description?: string;
  members?: TeamMember[];
  className?: string;
};

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    name: 'John Jonas',
    role: 'CEO & Co-Founder',
    bio: 'John is the visionary behind Zippay, leading the company with a strategic focus on innovation and growth. With over 15 years of experience in financial technology.',
    avatarSrc: '/images/about/team/m1.webp',
    twitter: '@john_jonas',
  },
  {
    name: 'Kristin Watson',
    role: 'CDO & Co-Founder',
    bio: 'Her expertise in design and user interface development helps ensure that Zippay is both intuitive and visually appealing.',
    avatarSrc: '/images/about/team/m2.webp',
    twitter: '@kristonwatson',
  },
  {
    name: 'Annette Black',
    role: 'CTO & Co-Founder',
    bio: 'With a background in software engineering and over a decade of experience in tech leadership, Annette is dedicated to building a reliable product.',
    avatarSrc: '/images/about/team/m3.webp',
    twitter: '@annetteblack',
  },
  {
    name: 'Ralph Edwards',
    role: 'Business & Co-Founder',
    bio: 'With extensive experience in business strategy and market expansion, Ralph focuses on building strong relationships and driving growth opportunities.',
    avatarSrc: '/images/about/team/m4.webp',
    twitter: '@ralpedward001',
  },
];

function twitterHref(handle?: string) {
  if (!handle) return undefined;
  const clean = handle.replace(/^@/, '');
  return `https://twitter.com/${clean}`;
}

export default function ZippayTeamMembers({
  tagline = 'Our Team',
  title = 'Meet The Zippay Team',
  description = 'Optimized checkout suite delivers a frictionless customer experience. Increase revenue and save thousands of engineering hours with prebuilt payment.',
  members = DEFAULT_MEMBERS,
  className,
}: ZippayTeamMembersProps) {
  return (
    <section className={cn('px-6 py-10 lg:py-24', className)}>
      <div className="container">
        <div className="max-w-3xl">
          <span className="text-body-sm-medium text-primary-200">
            {tagline}
          </span>
          <h2 className="text-heading-1 text-foreground mt-3 tracking-tight lg:text-[52px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mt-3 text-gray-500">
            {description}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-12">
          {members.map((m) => {
            const href = m.href ?? twitterHref(m.twitter);
            return (
              <article
                key={m.name}
                className="bg-gray-25 rounded-2xl border border-gray-50 p-5 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gray-0 grid size-12 place-items-center overflow-hidden rounded-full ring-1 ring-black/5">
                    <Image
                      src={m.avatarSrc}
                      alt={`${m.name} avatar`}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <h3 className="text-heading-4 text-foreground mt-4 tracking-tight">
                  {m.name}
                </h3>
                <p className="text-body-sm mt-1 text-gray-500">{m.role}</p>

                <p className="text-body-md mt-4 text-gray-500">{m.bio}</p>

                {m.twitter && (
                  <div className="mt-5">
                    {href ? (
                      <Link
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="bg-gray-0 hover:bg-gray-0/90 inline-flex items-center gap-2 rounded-full border border-gray-100 px-3 py-1.5 text-sm text-gray-900 transition"
                        aria-label={`${m.twitter} on X`}
                      >
                        {m.twitter}
                        <Image
                          src="/icons/arrow-right.svg"
                          alt=""
                          width={16}
                          height={16}
                          className="h-4 w-4"
                        />
                      </Link>
                    ) : (
                      <span className="bg-gray-0 inline-flex items-center gap-2 rounded-full border border-gray-100 px-3 py-1.5 text-sm text-gray-900">
                        {m.twitter}
                        <Image
                          src="/icons/arrow-right.svg"
                          alt=""
                          width={16}
                          height={16}
                          className="h-4 w-4"
                        />
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
