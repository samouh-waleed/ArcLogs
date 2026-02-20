'use client';

import { AlertCircle, GitPullRequest, TrendingUp } from 'lucide-react';

type KeyInsightsHeroCardProps = {
  className?: string;
};

export default function KeyInsightsHeroCard({
  className = '',
}: KeyInsightsHeroCardProps) {
  return (
    <div
      className={`w-[300px] rounded-2xl bg-white p-4 shadow-xl ${className}`}
    >
      {/* Header */}
      <h3 className="mb-3 text-sm font-bold text-gray-900">
        Key Insights & Blockers
      </h3>

      {/* Insights List */}
      <div className="space-y-2.5">
        {/* Blocker Item */}
        <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 p-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-xs text-gray-700">Sarah needs access token.</p>
        </div>

        {/* PR Review Item */}
        <div className="flex items-center gap-2.5 rounded-lg bg-blue-50 p-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <GitPullRequest className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="text-xs text-gray-700">PR reviews pending for Mike.</p>
        </div>

        {/* Progress Item */}
        <div className="flex items-center gap-2.5 rounded-lg bg-green-50 p-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
          </div>
          <p className="text-xs text-gray-700">
            Team velocity up 12% this week.
          </p>
        </div>
      </div>
    </div>
  );
}
