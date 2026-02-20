'use client';

import { MessageSquare, Mic } from 'lucide-react';

type DailyStandupOverlayProps = {
  className?: string;
};

export default function DailyStandupOverlay({
  className = '',
}: DailyStandupOverlayProps) {
  return (
    <div
      className={`w-[350px] overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[390px] ${className}`}
    >
      {/* Header */}
      <div className="bg-[#1e293b] px-5 py-3.5 text-white">
        <h3 className="text-sm font-semibold">
          Daily Standup - Engineering Team
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-5 p-5">
        {/* Sarah - Voice */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Mic className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-gray-900">
              <span className="font-semibold">Sarah (Voice):</span>{' '}
              <span className="text-gray-600">
                Working on API... Blocker detected.
              </span>
            </p>
          </div>
        </div>

        {/* Connector line */}
        <div className="ml-[22px] h-4 w-px bg-gray-200" />

        {/* Mike - Text */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-gray-900">
              <span className="font-semibold">Mike (Text):</span>{' '}
              <span className="text-gray-600">
                Frontend components... Reviewing PRs today.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
