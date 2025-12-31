'use client';

import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type BlogCard = {
  slug: string;
  title: string;
  intro?: string;
  tagline?: string;
  category?: string;
};

export type ZippayBlogGridProps = {
  posts: BlogCard[];
  title?: string;
};

const PER_PAGE = 6;
const ALL = 'All Categories';

export default function ZippayBlogGrid({
  posts,
  title = 'Our Most Popular Blog',
}: ZippayBlogGridProps) {
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => set.add((p.category ?? 'General').trim()));
    return [ALL, ...Array.from(set).sort()];
  }, [posts]);

  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => setPage(1), [query, category]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const cat = (p.category ?? 'General').trim();
      const inCat = category === ALL || cat === category;
      if (!inCat) return false;
      if (!q) return true;
      const hay =
        `${p.title} ${p.intro ?? ''} ${p.tagline ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [posts, query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <section className="px-6 py-10 lg:py-24 dark:bg-gray-200">
      <div className="container">
        <h2 className="text-heading-2 text-foreground mb-6 tracking-tight lg:mb-8">
          {title}
        </h2>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[220px_minmax(0,1fr)] lg:mb-8">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="focus:ring-primary/30 bg-gray-0 h-11 w-full rounded-[12px] border border-gray-100 px-3 text-sm text-gray-700 focus:ring-2">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent
              align="start"
              sideOffset={6}
              className="bg-gray-0 min-w-[220px] rounded-[12px] border border-gray-100 p-1"
            >
              {categories.map((c) => (
                <SelectItem
                  key={c}
                  value={c}
                  className="data-[highlighted]:bg-gray-25 rounded-[8px] px-3 py-2 text-sm"
                >
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="focus:ring-primary/30 bg-gray-0 h-11 rounded-[12px] border border-gray-100 px-3 text-sm text-gray-700 outline-none focus:ring-2"
          />
        </div>

        {pageItems.length === 0 ? (
          <p className="text-body-md text-gray-500">No posts found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {pageItems.map((p) => (
              <article
                key={p.slug}
                className={cn(
                  'bg-gray-0 flex min-h-[300px] flex-col justify-between rounded-2xl border border-gray-50 p-5 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] lg:p-8',
                )}
              >
                <div>
                  {!!p.tagline && (
                    <span className="text-body-xs bg-secondary-0 text-secondary-300 inline-flex w-fit items-center justify-center rounded-[6px] px-2 py-1.5 whitespace-nowrap">
                      {p.tagline}
                    </span>
                  )}
                  <h4 className="text-heading-4 text-foreground mt-3 tracking-tight">
                    {p.title}
                  </h4>
                </div>

                <Button asChild variant="secondary" className="w-fit px-4">
                  <Link href={`/blog/${p.slug}`}>
                    <span className="mr-2">Read More</span>
                    <Image
                      src="/icons/arrow-right.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="h-[20px] w-[20px] dark:invert"
                    />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between lg:mt-8">
            <p className="text-body-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                disabled={!canPrev}
                onClick={() => canPrev && setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                disabled={!canNext}
                onClick={() => canNext && setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
