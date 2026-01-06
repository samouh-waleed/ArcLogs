'use client';

import { Mic, MessageSquare } from 'lucide-react';

type DailyStandupOverlayProps = {
  className?: string;
};

export default function DailyStandupOverlay({ className = '' }: DailyStandupOverlayProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden w-[350px] sm:w-[390px] ${className}`}>
      {/* Header */}
      <div className="bg-[#1e293b] text-white px-5 py-3.5">
        <h3 className="text-sm font-semibold">Daily Standup - Engineering Team</h3>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Sarah - Voice */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
            <Mic className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 leading-relaxed">
              <span className="font-semibold">Sarah (Voice):</span>{' '}
              <span className="text-gray-600">Working on API... Blocker detected.</span>
            </p>
          </div>
        </div>

        {/* Connector line */}
        <div className="ml-[22px] w-px h-4 bg-gray-200" />

        {/* Mike - Text */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 leading-relaxed">
              <span className="font-semibold">Mike (Text):</span>{' '}
              <span className="text-gray-600">Frontend components... Reviewing PRs today.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}