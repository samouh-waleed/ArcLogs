'use client';

import { Mic, MessageSquare } from 'lucide-react';

type DailyStandupCardProps = {
  className?: string;
};

export default function DailyStandupCard({ className = '' }: DailyStandupCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-[280px] ${className}`}>
      {/* Header */}
      <div className="bg-[#1e293b] text-white px-3 py-2.5">
        <h3 className="text-xs font-semibold">Daily Standup - Engineering Team</h3>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Sarah - Voice */}
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-900">
              <span className="font-semibold">Sarah (Voice):</span>{' '}
              <span className="text-gray-600">Working on API... Blocker detected.</span>
            </p>
          </div>
        </div>

        {/* Connector line */}
        <div className="ml-4 w-px h-3 bg-gray-200" />

        {/* Mike - Text */}
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
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