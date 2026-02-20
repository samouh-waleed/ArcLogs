'use client';

import { MessageSquare, Mic } from 'lucide-react';

type DailyStandupCardProps = {
  className?: string;
};

export default function DailyStandupCard({
  className = '',
}: DailyStandupCardProps) {
  return (
    <div
      className={`w-full max-w-[280px] overflow-hidden rounded-xl bg-white shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="bg-[#1e293b] px-3 py-2.5 text-white">
        <h3 className="text-xs font-semibold">
          Daily Standup - Engineering Team
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-3 p-3">
        {/* Sarah - Voice */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Mic className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-900">
              <span className="font-semibold">Sarah (Voice):</span>{' '}
              <span className="text-gray-600">
                Working on API... Blocker detected.
              </span>
            </p>
          </div>
        </div>

        {/* Connector line */}
        <div className="ml-4 h-3 w-px bg-gray-200" />

        {/* Mike - Text */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-900">
              <span className="font-semibold">Mike (Text):</span>{' '}
              <span className="text-gray-600">Frontend components...</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
