'use client';

import ContentIllustration2 from './content-illustration2';

/**
 * ArcLogsInsightsSection component handles the display of AI-powered blocker
 * and sentiment analysis features.
 */
export default function ArcLogsInsightsSection() {
  return (
    <section className="bg-background overflow-hidden px-6 py-10 lg:py-24">
      <div className="container grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
        {/* Left Side: Text Content explaining the AI value proposition */}
        <div className="max-w-[616px]">
          <span className="text-body-sm-medium inline-flex h-8 items-center gap-2 rounded-[10px] border border-gray-100 bg-white px-3 shadow-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Insights
          </span>

          <h2 className="text-foreground text-heading-1 mt-6 leading-[1.1] tracking-tight lg:text-[64px]">
            Spot Blockers Before They Stall
          </h2>

          <p className="text-body-lg mt-6 max-w-prose leading-relaxed text-gray-500">
            AI automatically analyzes updates to surface blocking issues and
            sentiment, helping you intervene exactly when needed.
          </p>
        </div>

        {/* Right Side: Visualizing the feature with the 3 staggered cards */}
        <div className="flex justify-center">
          <ContentIllustration2 className="w-full" />
        </div>
      </div>
    </section>
  );
}
