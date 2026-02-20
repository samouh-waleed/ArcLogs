'use client';

import Link from 'next/link';
import * as React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FaqItem = { question: string; answer: string };

export type ZippayFAQProps = {
  tagline?: string;
  title?: string;
  description?: string;
  items?: FaqItem[];
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
  softBg?: boolean;
};

// UPDATED: ArcLogs specific questions
const DEFAULT_ITEMS: FaqItem[] = [
  {
    question: 'How does ArcLogs differ from a regular standup?',
    answer:
      'ArcLogs replaces the 15-minute live meeting with async voice or text updates. This saves your team hours per week, creates a searchable history, and lets deep work happen uninterrupted.',
  },
  {
    question: 'How does the AI blocker detection work?',
    answer:
      'Our AI analyzes daily updates for language indicating hurdles (e.g., "waiting on API," "blocked by"). It automatically tags these as blockers and surfaces them in the dashboard so leads can intervene immediately.',
  },
  {
    question: 'Does ArcLogs integrate with our existing tools?',
    answer:
      'Yes. ArcLogs pushes summaries and alerts directly to Slack, Jira, and GitHub, ensuring your team stays in sync without leaving the tools they already use.',
  },
  {
    question: 'Can I use ArcLogs for non-engineering teams?',
    answer:
      'While optimized for engineering workflows, ArcLogs is excellent for product, design, and marketing teams that want to maintain alignment without the calendar clutter.',
  },
];

export default function ZippayFAQ({
  tagline = 'Support', // Changed from FAQs
  title = 'Questions? We’ve got answers.', // More conversational title
  description = 'Everything you need to know about switching your team to asynchronous standups.', // ArcLogs specific description
  items = DEFAULT_ITEMS,
  ctaHref = '/contact', // Changed to contact for now, or '/faq' if you build that page
  ctaLabel = 'Contact Support',
  className,
  softBg,
}: ZippayFAQProps) {
  return (
    <section
      className={cn(
        'px-6 py-10 lg:py-24',
        softBg && 'bg-gray-25 dark:bg-gray-200',
        className,
      )}
    >
      <div className="container">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
          <span className="text-body-sm-medium text-primary-200">
            {tagline}
          </span>
          <h2 className="text-foreground text-heading-1 mt-4 tracking-tight lg:text-[52px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mt-4 max-w-[568px] text-gray-400">
            {description}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl space-y-3 lg:mt-12">
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-[18px]"
          >
            {items.map((item, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border-none"
              >
                <div
                  className={cn(
                    'rounded-2xl border border-gray-50',
                    softBg ? 'bg-gray-0' : 'bg-gray-25',
                  )}
                >
                  <AccordionTrigger
                    className={cn(
                      'group flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left sm:px-6 sm:py-5',
                      'hover:no-underline',
                      '[&>svg]:hidden',
                    )}
                  >
                    <span className="text-body-lg-medium text-foreground">
                      {item.question}
                    </span>
                    <span
                      aria-hidden
                      className="text-foreground text-xl group-data-[state=open]:hidden"
                    >
                      +
                    </span>
                    <span
                      aria-hidden
                      className="text-foreground hidden text-xl group-data-[state=open]:block"
                    >
                      −
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                    <p className="text-body-md text-gray-400">{item.answer}</p>
                  </AccordionContent>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="secondary" className="px-5">
            <Link href={ctaHref}>
              <span className="mr-2">{ctaLabel}</span>
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
