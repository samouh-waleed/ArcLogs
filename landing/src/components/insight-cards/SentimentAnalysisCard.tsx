// landing/src/components/insight-cards/SentimentAnalysisCard.tsx
'use client';

import { TrendingDown } from 'lucide-react';

export default function SentimentAnalysisCard({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-2xl p-4 w-full max-w-[240px] ${className}`}
    >
      <h3 className="mb-2 text-xs font-semibold text-gray-900">
        Sentiment Analysis
      </h3>

      <div className="mb-3 h-16 w-full">
        {/* Simple SVG Line Chart */}
        <svg
          viewBox="0 0 100 40"
          className="h-full w-full overflow-visible"
        >
          <path
            d="M0,10 Q20,5 40,25 T80,15 T100,35"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="100" cy="35" r="3" fill="#2563eb" />
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-900 whitespace-nowrap">
          Team Morale:
        </span>

        <div className="flex items-center text-xs font-bold text-red-500">
          <TrendingDown className="mr-0.5 h-3 w-3" />
          -15%
        </div>

        <span className="whitespace-nowrap text-[10px] text-gray-400">
          (Last 7 Days)
        </span>
      </div>
    </div>
  );
}
