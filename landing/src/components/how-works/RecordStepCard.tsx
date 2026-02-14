'use client';

import { Clock, MessageSquare, Mic } from 'lucide-react';

type RecordStepCardProps = {
  className?: string;
};

export default function RecordStepCard({
  className = '',
}: RecordStepCardProps) {
  return (
    <div
      className={`w-[300px] overflow-hidden rounded-2xl bg-white shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="bg-blue-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <span className="text-xs font-bold">1</span>
          </div>
          <h3 className="text-sm font-semibold">Record or Type Your Update</h3>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        {/* Voice Option */}
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Mic className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Voice Update</p>
            <p className="text-xs text-gray-500">60 seconds max</p>
          </div>
          {/* Restored Waveform visualization */}
          <div className="flex items-center gap-0.5">
            {[3, 5, 8, 6, 9, 4, 7, 5, 3].map((h, i) => (
              <div
                key={i}
                className="w-1 animate-pulse rounded-full bg-blue-400"
                style={{
                  height: `${h * 2}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Text Option */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Text Update</p>
            <p className="text-xs text-gray-500">Quick typed check-in</p>
          </div>
        </div>

        {/* Time indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            Takes less than 2 minutes
          </span>
        </div>
      </div>
    </div>
  );
}
