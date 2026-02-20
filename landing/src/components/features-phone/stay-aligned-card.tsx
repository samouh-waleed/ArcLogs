'use client';

import { CheckCircle2, Clock, Users } from 'lucide-react';

type StayAlignedCardProps = {
  className?: string;
};

export default function StayAlignedCard({
  className = '',
}: StayAlignedCardProps) {
  return (
    <div
      className={`w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[420px] ${className}`}
    >
      {/* Header */}
      <div className="bg-[#059669] px-5 py-3.5 text-white">
        <h3 className="text-sm font-semibold">Team Alignment Dashboard</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Stats Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">8/10</p>
            <p className="text-xs text-gray-500">Updates Today</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">5.2h</p>
            <p className="text-xs text-gray-500">Saved This Week</p>
          </div>
        </div>

        {/* Team Progress */}
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                Team Progress
              </span>
            </div>
            <span className="text-sm font-semibold text-green-600">80%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-green-400 to-green-600" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Everyone aligned without a single meeting
          </p>
        </div>
      </div>
    </div>
  );
}
