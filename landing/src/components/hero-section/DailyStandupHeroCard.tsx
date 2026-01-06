'use client';

import { Mic, MessageSquare } from 'lucide-react';
import Image from 'next/image';

type DailyStandupHeroCardProps = {
  className?: string;
};

export default function DailyStandupHeroCard({ className = '' }: DailyStandupHeroCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl p-5 w-full max-w-[340px] ${className}`}>

      {/* Header */}
      <h3 className="text-base font-bold text-gray-900 mb-4">
        Daily Standup - Engineering Team
      </h3>

      {/* Team Members Updates */}
      <div className="space-y-4">
        {/* Sarah - Voice */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Mic className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Sarah (Voice):</span>
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              "Working on API integration. Blocker: Waiting for access token."
            </p>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              (AI Insight: Blocker detected)
            </p>
          </div>
          {/* Connector line */}
          <div className="absolute left-[22px] top-[52px] w-px h-8 bg-gray-200 hidden" />
        </div>

        {/* Mike - Text */}
        <div className="flex items-start gap-3 border-l-2 border-gray-100 pl-3 ml-4">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Mike (Text):</span>{' '}
              <span className="text-gray-600">"Frontend components are done. Reviewing PRs today."</span>
            </p>
          </div>
        </div>

        {/* Emily - Voice */}
        <div className="flex items-start gap-3 border-l-2 border-gray-100 pl-3 ml-4">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center">
              <span className="text-xs font-medium text-amber-700">EW</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Emily (Voice):</span>{' '}
              <span className="text-gray-600">"Design mockups are ready for review. No blockers."</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}