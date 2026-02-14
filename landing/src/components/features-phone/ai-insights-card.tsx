'use client';

import { AlertTriangle, Brain, TrendingUp, Users } from 'lucide-react';

type AIInsightsCardProps = {
  className?: string;
};

export default function AIInsightsCard({
  className = '',
}: AIInsightsCardProps) {
  return (
    <div
      className={`w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[420px] ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <h3 className="text-sm font-semibold">AI Insights Summary</h3>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-5">
        {/* Blockers Detected */}
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-900">
              2 Blockers Detected
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              Sarah needs API access, Mike waiting on design
            </p>
          </div>
        </div>

        {/* Team Sentiment */}
        <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">
              Positive Sentiment
            </p>
            <p className="mt-0.5 text-xs text-green-600">
              Team morale is up 15% this week
            </p>
          </div>
        </div>

        {/* Key Theme */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Key Theme: Collaboration
            </p>
            <p className="mt-0.5 text-xs text-blue-600">
              3 team members mentioned cross-team work
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
