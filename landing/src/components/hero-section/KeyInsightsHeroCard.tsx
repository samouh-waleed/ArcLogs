'use client';

import { AlertCircle, GitPullRequest, TrendingUp } from 'lucide-react';

type KeyInsightsHeroCardProps = {
  className?: string;
};

export default function KeyInsightsHeroCard({ className = '' }: KeyInsightsHeroCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl p-4 w-[300px] ${className}`}>

      {/* Header */}
      <h3 className="text-sm font-bold text-gray-900 mb-3">
        Key Insights & Blockers
      </h3>

      {/* Insights List */}
      <div className="space-y-2.5">
        {/* Blocker Item */}
        <div className="flex items-center gap-2.5 p-2 bg-amber-50 rounded-lg">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xs text-gray-700">
            Sarah needs access token.
          </p>
        </div>

        {/* PR Review Item */}
        <div className="flex items-center gap-2.5 p-2 bg-blue-50 rounded-lg">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <GitPullRequest className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xs text-gray-700">
            PR reviews pending for Mike.
          </p>
        </div>

        {/* Progress Item */}
        <div className="flex items-center gap-2.5 p-2 bg-green-50 rounded-lg">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          </div>
          <p className="text-xs text-gray-700">
            Team velocity up 12% this week.
          </p>
        </div>
      </div>
    </div>
  );
}