'use client';

import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type Props = {
  title: string;
  category: string;
  summary: string;
  icon?: string;
  badges?: string[];
  website?: string;
  pricing?: string;
  terms?: string;
  children: React.ReactNode;
};

export default function ZippayIntegrationPost({
  title,
  category,
  summary,
  icon,
  badges = [],
  website,
  pricing,
  terms,
  children,
}: Props) {
  return (
    <article>
      <section>
        <div className="bg-primary-300 text-white">
          <div className="container px-6 py-10 lg:py-14">
            <Link
              href="/integrations"
              className="mb-8 inline-flex items-center text-white hover:underline lg:mb-13"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Integrations
            </Link>
            <div className="flex flex-col items-start gap-4 lg:flex-row">
              {!!icon && (
                <Image
                  src={icon}
                  alt={`${title} logo`}
                  width={48}
                  height={48}
                  className="bg-primary-200 h-18 w-18 rounded-[10px] p-2"
                />
              )}
              <div>
                <div className="text-body-xs-medium bg-gray-0/10 inline-flex h-7 items-center rounded-[10px] border border-white/15 px-3 text-white/90 backdrop-blur-[2px]">
                  {category}
                </div>
                <h1 className="text-heading-1 mt-3 tracking-tight lg:text-[52px]">
                  {title}
                </h1>
                <p className="text-body-md sm:text-body-lg mt-3 max-w-3xl text-white/80">
                  {summary}
                </p>

                {!!badges.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <span
                        key={b}
                        className="text-body-xs bg-gray-0/10 rounded-[8px] border border-white/15 px-2 py-1 text-white/85"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="px-6 pb-16 lg:pb-24">
        <div className="container mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24">
            <div className="bg-gray-0 rounded-2xl p-5">
              <p className="text-body-sm-medium text-gray-900">Support</p>
              <ul className="text-body-sm mt-3 space-y-2">
                {website && (
                  <li>
                    <Link
                      className="text-primary-200 hover:underline"
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Website
                    </Link>
                  </li>
                )}
                {pricing && (
                  <li>
                    <Link
                      className="text-primary-200 hover:underline"
                      href={pricing}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Pricing
                    </Link>
                  </li>
                )}
                {terms && (
                  <li>
                    <Link
                      className="text-primary-200 hover:underline"
                      href={terms}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Terms of Service
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </aside>

          <section
            className={cn(
              'prose prose-lg dark:prose-invert max-w-none',
              '[--tw-prose-body:var(--color-foreground)]',
              '[--tw-prose-headings:var(--color-foreground)]',
            )}
          >
            {children}
          </section>
        </div>
      </section>
    </article>
  );
}
