'use client';

import { CheckCircle2, Clock, Users, BarChart3 } from 'lucide-react';

type StayAlignedCardProps = {
  className?: string;
};

export default function StayAlignedCard({ className = '' }: StayAlignedCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden w-[380px] sm:w-[420px] ${className}`}>
      {/* Header */}
      <div className="bg-[#059669] text-white px-5 py-3.5">
        <h3 className="text-sm font-semibold">Team Alignment Dashboard</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">8/10</p>
            <p className="text-xs text-gray-500">Updates Today</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-center">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">5.2h</p>
            <p className="text-xs text-gray-500">Saved This Week</p>
          </div>
        </div>

        {/* Team Progress */}
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">Team Progress</span>
            </div>
            <span className="text-sm font-semibold text-green-600">80%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-[80%] bg-gradient-to-r from-green-400 to-green-600 rounded-full" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Everyone aligned without a single meeting</p>
        </div>
      </div>
    </div>
  );
}