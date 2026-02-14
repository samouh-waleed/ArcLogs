'use client';

import { MessageSquare, Mic } from 'lucide-react';

type DailyStandupHeroCardProps = {
  className?: string;
};

export default function DailyStandupHeroCard({
  className = '',
}: DailyStandupHeroCardProps) {
  return (
    <div
      className={`w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl ${className}`}
    >
      {/* Header */}
      <h3 className="mb-4 text-base font-bold text-gray-900">
        Daily Standup - Engineering Team
      </h3>

      {/* Team Members Updates */}
      <div className="space-y-4">
        {/* Sarah - Voice */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <Mic className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Sarah (Voice):</span>
            </p>
            <p className="mt-0.5 text-sm text-gray-600">
              "Working on API integration. Blocker: Waiting for access token."
            </p>
            <p className="mt-1 text-xs font-medium text-blue-600">
              (AI Insight: Blocker detected)
            </p>
          </div>
          {/* Connector line */}
          <div className="absolute top-[52px] left-[22px] hidden h-8 w-px bg-gray-200" />
        </div>

        {/* Mike - Text */}
        <div className="ml-4 flex items-start gap-3 border-l-2 border-gray-100 pl-3">
          <div className="relative flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100">
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Mike (Text):</span>{' '}
              <span className="text-gray-600">
                "Frontend components are done. Reviewing PRs today."
              </span>
            </p>
          </div>
        </div>

        {/* Emily - Voice */}
        <div className="ml-4 flex items-start gap-3 border-l-2 border-gray-100 pl-3">
          <div className="relative flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amber-100">
              <span className="text-xs font-medium text-amber-700">EW</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Emily (Voice):</span>{' '}
              <span className="text-gray-600">
                "Design mockups are ready for review. No blockers."
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
