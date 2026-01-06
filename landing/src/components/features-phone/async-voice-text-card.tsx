'use client';

import { Mic, MessageSquare, Clock } from 'lucide-react';

type AsyncVoiceTextCardProps = {
  className?: string;
};

export default function AsyncVoiceTextCard({ className = '' }: AsyncVoiceTextCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden w-[380px] sm:w-[420px] ${className}`}>
      {/* Header */}
      <div className="bg-[#2563eb] text-white px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Async Updates - Engineering Team</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Sarah - Voice Update */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Mic className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Sarah (Voice)</p>
            <p className="text-xs text-blue-600 mt-0.5">Working on API integration... Blocker detected.</p>
          </div>
        </div>

        {/* Mike - Text Update */}
        <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">Mike (Text)</p>
            <p className="text-xs text-purple-600 mt-0.5">Frontend components done. Reviewing PRs today.</p>
          </div>
        </div>

        {/* Lisa - Voice Update */}
        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Mic className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Lisa (Voice)</p>
            <p className="text-xs text-green-600 mt-0.5">Database migration complete. All tests passing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}