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

const DEFAULT_ITEMS: FaqItem[] = [
  {
    question: 'What is Zippay?',
    answer:
      'Zippay is an AP platform that streamlines invoice intake, approvals, and payments—reducing manual work and errors.',
  },
  {
    question: 'How does Zippay’s global corporate card work?',
    answer:
      'Issue cards in seconds, set policy controls, and get real-time visibility across currencies with automatic reconciliation.',
  },
  {
    question: 'How secure is my financial data with Zippay?',
    answer:
      'We use robust encryption, strict access controls, and frequent audits to safeguard your data to the highest standards.',
  },
  {
    question: 'Is Zippay suitable for businesses of all sizes?',
    answer:
      'Yes—from startups to enterprises, Zippay scales to your team with flexible controls and integrations.',
  },
];

export default function ZippayFAQ({
  tagline = 'FAQs',
  title = 'Frequently Asked Questions',
  description = 'Find answers to common queries and get the information you need quickly and easily.',
  items = DEFAULT_ITEMS,
  ctaHref = '/faq',
  ctaLabel = 'See All FAQs',
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
