'use client';

import { BarChart3 } from 'lucide-react';

type TeamActivityCardProps = {
  className?: string;
};

export default function TeamActivityCard({ className = '' }: TeamActivityCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-xl p-4 w-full max-w-[220px] ${className}`}>
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Team Activity</h3>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-600">Today's Updates: 8/10</p>
    </div>
  );
}