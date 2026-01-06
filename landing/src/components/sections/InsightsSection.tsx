'use client';

import ContentIllustration2 from './content-illustration2';

/**
 * ArcLogsInsightsSection component handles the display of AI-powered blocker 
 * and sentiment analysis features.
 */
export default function ArcLogsInsightsSection() {
  return (
    <section className="px-6 py-10 lg:py-24 bg-background overflow-hidden">
      <div className="container grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
        
        {/* Left Side: Text Content explaining the AI value proposition */}
        <div className="max-w-[616px]">
          <span className="text-body-sm-medium bg-white inline-flex h-8 items-center gap-2 rounded-[10px] border border-gray-100 px-3 shadow-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Insights
          </span>

          <h2 className="text-foreground text-heading-1 mt-6 tracking-tight lg:text-[64px] leading-[1.1]">
            Spot Blockers Before They Stall
          </h2>

          <p className="text-body-lg mt-6 max-w-prose text-gray-500 leading-relaxed">
            AI automatically analyzes updates to surface blocking issues and sentiment, 
            helping you intervene exactly when needed.
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