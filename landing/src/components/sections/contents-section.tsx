'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

import ContentIllustration from './content-illustration1';
import ContentIllustration2 from './content-illustration2';

type ContentItem = {
  tagline: string;
  title: string;
  description: string;
  imageAlt?: string;
  align?: 'left' | 'right';
};

export type ZippayContentsSectionProps = {
  items?: ContentItem[];
};

const DEFAULT_ITEMS: ContentItem[] = [
  {
    tagline: 'Sync',
    title: 'Stay in Sync, Without the Meeting',
    description:
      'Replace daily standups with asynchronous updates. Team members report progress on their own time, keeping everyone aligned without interrupting flow.',
    imageAlt: 'Async standup interface cards',
    align: 'left',
  },
  {
    tagline: 'Insights',
    title: 'Spot Blockers Before They Stall',
    description:
      'AI automatically analyzes updates to surface blocking issues and sentiment, helping you intervene exactly when needed.',
    imageAlt: 'AI insights dashboard',
    align: 'right',
  },
];

export default function ZippayContentsSection({
  items = DEFAULT_ITEMS,
}: ZippayContentsSectionProps) {
  return (
    <section id="arclogs-contents" className="px-6 py-10 lg:py-24 bg-background">
      <div className="container space-y-32 lg:space-y-48">
        {items.map((item, i) => {
          // Cleaned up imageBlock: Removed invalid props to fix TypeScript error
          const imageBlock = (
            <div className="w-full">
              {i === 0 ? (
                <ContentIllustration className="w-full" />
              ) : (
                <ContentIllustration2 className="w-full" />
              )}
            </div>
          );

          const textBlock = (
            <div className="max-w-[616px]">
              <span className="text-body-sm-medium bg-white inline-flex h-8 items-center gap-2 rounded-[10px] border border-gray-100 px-3 py-0 leading-none shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item.tagline}
              </span>

              <h2 className="text-foreground text-heading-1 mt-6 tracking-tight lg:text-[64px] leading-[1.1]">
                {item.title}
              </h2>

              <p className="text-body-lg mt-6 max-w-prose text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          );

          const reversed = item.align === 'right';

          return (
            <div
              key={i}
              className={cn(
                /* Changed grid ratio to [1fr_1.4fr] to give the image column 
                   significantly more room to grow compared to the text.
                */
                'grid items-center gap-16 lg:grid-cols-[1fr_1.4fr] lg:gap-24',
              )}
            >
              <div className={cn('order-1', reversed && 'lg:order-2')}>
                {textBlock}
              </div>

              <div className={cn('order-2', reversed && 'lg:order-1 flex justify-center')}>
                {imageBlock}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}