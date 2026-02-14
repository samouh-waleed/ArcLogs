'use client';

import { Clock, MessageSquare, Mic } from 'lucide-react';

type AsyncVoiceTextCardProps = {
  className?: string;
};

export default function AsyncVoiceTextCard({
  className = '',
}: AsyncVoiceTextCardProps) {
  return (
    <div
      className={`w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[420px] ${className}`}
    >
      {/* Header */}
      <div className="bg-[#2563eb] px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-semibold">
            Async Updates - Engineering Team
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-5">
        {/* Sarah - Voice Update */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Mic className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Sarah (Voice)</p>
            <p className="mt-0.5 text-xs text-blue-600">
              Working on API integration... Blocker detected.
            </p>
          </div>
        </div>

        {/* Mike - Text Update */}
        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">Mike (Text)</p>
            <p className="mt-0.5 text-xs text-purple-600">
              Frontend components done. Reviewing PRs today.
            </p>
          </div>
        </div>

        {/* Lisa - Voice Update */}
        <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <Mic className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Lisa (Voice)</p>
            <p className="mt-0.5 text-xs text-green-600">
              Database migration complete. All tests passing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
