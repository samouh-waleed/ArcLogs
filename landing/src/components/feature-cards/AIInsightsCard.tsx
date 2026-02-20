'use client';

import { Brain } from 'lucide-react';

type AIInsightsCardProps = {
  className?: string;
};

export default function AIInsightsCard({
  className = '',
}: AIInsightsCardProps) {
  return (
    /* Width reduced to 260px to remove empty white space */
    <div
      className={`w-full max-w-[260px] rounded-xl bg-white p-3 shadow-2xl ${className}`}
    >
      {/* Header with icon */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <Brain className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <h3 className="text-xs font-semibold text-gray-900">AI Insights</h3>
      </div>

      {/* Content highlighting surfaced blockers and help requests */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-gray-600">
          Blocker detected: API auth flow
        </p>
        <p className="text-xs text-gray-400">
          Help needed: Sarah is blocked on testing
        </p>
      </div>
    </div>
  );
}
