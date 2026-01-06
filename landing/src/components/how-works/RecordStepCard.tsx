'use client';

import { Mic, MessageSquare, Clock } from 'lucide-react';

type RecordStepCardProps = {
  className?: string;
};

export default function RecordStepCard({ className = '' }: RecordStepCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden w-[300px] ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xs font-bold">1</span>
          </div>
          <h3 className="text-sm font-semibold">Record or Type Your Update</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Voice Option */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Mic className="w-5 h-5 text-blue-600" />
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
                className="w-1 bg-blue-400 rounded-full animate-pulse"
                style={{ 
                  height: `${h * 2}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Text Option */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Text Update</p>
            <p className="text-xs text-gray-500">Quick typed check-in</p>
          </div>
        </div>

        {/* Time indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">Takes less than 2 minutes</span>
        </div>
      </div>
    </div>
  );
}