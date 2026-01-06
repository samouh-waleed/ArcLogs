'use client';

import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ZippayBlogPostProps {
  tagline?: string;
  title: string;
  intro?: string;
  image?: string;
  author?: string;
  published?: string;
  children: React.ReactNode;
}

type TocItem = { id: string; text: string; level: number };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

export default function ZippayBlogPost({
  title,
  intro,
  author,
  published,
  children,
}: ZippayBlogPostProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [toc, setToc] = React.useState<TocItem[]>([]);
  const [readMins, setReadMins] = React.useState<number | null>(null);

  React.useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const hs = Array.from(root.querySelectorAll('h2, h3')) as
      | HTMLHeadingElement[]
      | [];
    const items: TocItem[] = [];
    hs.forEach((h) => {
      let id = h.getAttribute('id') || '';
      const text = h.textContent?.trim() || '';
      if (!id && text) {
        id = slugify(text);
        h.setAttribute('id', id);
      }
      if (id && text) {
        items.push({ id, text, level: h.tagName === 'H3' ? 3 : 2 });
      }
    });
    setToc(items);

    const text = root.textContent || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setReadMins(Math.max(1, Math.round(words / 200)));
  }, [children]);

  const formattedDate =
    published &&
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(published));

  return (
    <article>
      <div className="bg-gray-25 px-6 py-10 lg:py-20 dark:bg-gray-200">
        <div className="container">
          <div className="max-w-4xl">
            <p className="text-body-sm text-gray-500">
              {readMins ? `${readMins} min` : ''}{' '}
              {formattedDate ? ` • ${formattedDate}` : ''}
            </p>

            <h1 className="text-heading-1 mt-4 tracking-tight lg:text-[44px] lg:leading-[125%]">
              {title}
            </h1>

            {!!intro && (
              <p className="text-body-md sm:text-body-lg mt-4 text-gray-500">
                {intro}
              </p>
            )}

            {(author || formattedDate) && (
              <div className="text-body-sm mt-10 flex items-center gap-3 text-gray-500">
                <Image
                  src="/images/blog/Avatar.webp"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
                <div className="leading-tight">
                  {author && <p className="text-gray-900">{author}</p>}
                  {formattedDate && (
                    <p className="text-gray-500">{formattedDate}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 py-10 lg:py-20 dark:bg-gray-100">
        <div className="container">
          <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
            <aside className="lg:sticky lg:top-24">
              <div className="bg-gray-25 rounded-2xl border border-gray-50 p-5 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)]">
                <p className="text-body-sm-medium text-gray-900">
                  Never miss new content
                </p>
                <p className="text-body-sm mt-1 text-gray-500">
                  Subscribe to keep up with the latest strategic finance
                  content.
                </p>
                <form
                  className="mt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <input
                    type="email"
                    placeholder="Email"
                    className="bg-gray-0 h-10 w-full rounded-[10px] border border-gray-100 px-3 text-sm ring-0 outline-none placeholder:text-gray-400 focus:border-gray-200"
                  />

                  <Button
                    type="submit"
                    variant="default"
                    className="mt-2 w-full"
                  >
                    Subscribe
                  </Button>
                </form>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <p className="text-body-sm text-gray-500">Share:</p>
                <div className="flex items-center gap-2">
                  {[
                    { href: '#', src: '/icons/xg.svg', label: 'X' },
                    { href: '#', src: '/icons/fbg.svg', label: 'LinkedIn' },
                    { href: '#', src: '/icons/igg.svg', label: 'YouTube' },
                  ].map((s) => (
                    <Link
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="bg-gray-0 inline-flex h-7 w-7 items-center justify-center rounded-[8px] border border-gray-100 shadow-[0_1px_2px_0_rgba(13,13,18,0.06)]"
                    >
                      <Image src={s.src} alt="" width={14} height={14} />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            <section
              ref={contentRef}
              className={cn(
                'prose prose-lg max-w-none',
                'prose-headings:text-gray-900',
                'prose-p:text-gray-600',
                'prose-strong:text-gray-900',
                'prose-a:text-gray-900 prose-a:underline-offset-2 hover:prose-a:underline',
              )}
            >
              {children}
            </section>

            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <div className="bg-gray-0 rounded-2xl p-4">
                <p className="text-body-sm-medium font-bold text-gray-900">
                  Content
                </p>
                <ul className="mt-3 space-y-4">
                  {toc.length === 0 ? (
                    <li className="text-body-sm text-gray-400">No headings</li>
                  ) : (
                    toc.map((t) => (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          className={cn(
                            'text-body-sm block text-gray-700 hover:text-gray-900',
                            t.level === 3 && 'pl-4',
                          )}
                        >
                          {t.text}
                        </a>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </article>
  );
}
