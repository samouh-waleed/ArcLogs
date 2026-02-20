'use client';

import { BarChart3 } from 'lucide-react';

type TeamActivityCardProps = {
  className?: string;
};

export default function TeamActivityCard({
  className = '',
}: TeamActivityCardProps) {
  return (
    <div
      className={`w-full max-w-[220px] rounded-xl bg-white p-4 shadow-xl ${className}`}
    >
      {/* Header with icon */}
      <div className="mb-1.5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Team Activity</h3>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-600">Today's Updates: 8/10</p>
    </div>
  );
}
