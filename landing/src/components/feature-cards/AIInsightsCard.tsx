'use client';

import { Brain } from 'lucide-react';

type AIInsightsCardProps = {
  className?: string;
};

export default function AIInsightsCard({ className = '' }: AIInsightsCardProps) {
  return (
    /* Width reduced to 260px to remove empty white space */
    <div className={`bg-white rounded-xl shadow-2xl p-3 w-full max-w-[260px] ${className}`}>
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <h3 className="text-xs font-semibold text-gray-900">AI Insights</h3>
      </div>

      {/* Content highlighting surfaced blockers and help requests */}
      <div className="space-y-0.5">
        <p className="text-xs text-gray-600 font-medium">Blocker detected: API auth flow</p>
        <p className="text-xs text-gray-400">Help needed: Sarah is blocked on testing</p>
      </div>
    </div>
  );
}