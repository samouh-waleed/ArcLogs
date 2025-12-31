'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BlogPost = {
  title: string;
  slug: string;
  description?: string;
  tagline?: string;
  coverImage?: string;
};

export default function ZippayBlogFeaturedPosts({
  posts = [],
}: {
  posts?: BlogPost[];
}) {
  if (!posts?.length) return null;

  const [first, ...rest] = posts;
  const small = rest.slice(0, 2);

  return (
    <section className="bg-gray-25 px-6 py-10 lg:py-16 dark:bg-gray-200">
      <div className="container space-y-6 lg:space-y-8">
        {!!first && (
          <article className="bg-gray-0 rounded-2xl border border-gray-50 p-5 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] lg:p-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
              <div className="flex flex-col justify-between lg:p-6">
                <div>
                  {!!first.tagline && (
                    <span className="text-body-xs bg-secondary-0 text-secondary-300 inline-flex w-fit items-center justify-center rounded-[6px] px-2 py-1.5 whitespace-nowrap">
                      {first.tagline}
                    </span>
                  )}

                  <h3 className="text-heading-3 text-foreground mt-3 tracking-tight lg:text-[36px]">
                    {first.title}
                  </h3>
                </div>
                <div className="mt-6">
                  <Button asChild variant="secondary" className="w-fit px-4">
                    <Link href={`/blog/${first.slug}`}>
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
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-full">
                  <Image
                    src={first.coverImage || '/images/blog/placeholder.webp'}
                    alt={first.title}
                    width={1280}
                    height={800}
                    priority
                    className="h-auto w-full rounded-xl object-cover"
                    sizes="(min-width:1024px) 560px, 100vw"
                  />
                </div>
              </div>
            </div>
          </article>
        )}

        {!!small.length && (
          <div className="grid gap-6 lg:grid-cols-2">
            {small.map((p) => (
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
      </div>
    </section>
  );
}
