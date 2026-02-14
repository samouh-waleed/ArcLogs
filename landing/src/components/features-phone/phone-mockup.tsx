'use client';

import {
  Activity,
  Bell,
  ChevronDown,
  CreditCard,
  Home,
  MessageSquare,
  User,
} from 'lucide-react';

type PhoneMockupProps = {
  className?: string;
};

export default function PhoneMockup({ className = '' }: PhoneMockupProps) {
  return (
    <div className={`relative ${className}`}>
      {/* iPhone Frame */}
      <div className="relative mx-auto w-[280px] sm:w-[300px]">
        {/* Phone outer frame */}
        <div className="relative rounded-[40px] bg-gray-900 p-2 shadow-2xl">
          {/* Phone inner bezel */}
          <div className="relative overflow-hidden rounded-[32px] bg-white">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-2 text-xs font-medium text-gray-900">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="h-2.5 w-0.5 rounded-full bg-gray-900" />
                  <div className="h-3 w-0.5 rounded-full bg-gray-900" />
                  <div className="h-3.5 w-0.5 rounded-full bg-gray-900" />
                  <div className="h-4 w-0.5 rounded-full bg-gray-900" />
                </div>
                <span className="ml-1">5G</span>
                <div className="ml-1 h-3 w-5 rounded-sm border border-gray-900 p-0.5">
                  <div className="h-full w-3/4 rounded-sm bg-gray-900" />
                </div>
              </div>
            </div>

            {/* Notch */}
            <div className="absolute top-0 left-1/2 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-900" />

            {/* App Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-[10px] font-medium text-gray-600">
                    AT
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600">
                    <span className="text-[8px] font-bold text-white">A</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">
                    Arc Logs
                  </span>
                </div>
              </div>
              <Bell className="h-4 w-4 text-gray-500" />
            </div>

            {/* Team Activity Header */}
            <div className="border-b border-gray-100 px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-gray-900">
                    Team Activity
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                  <span className="text-[10px] text-gray-600">Month</span>
                  <ChevronDown className="h-2.5 w-2.5 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-2 p-3">
              {/* Arthur Taylor Update */}
              <div className="rounded-lg bg-gray-50 p-2">
                <div className="flex items-start gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                    <span className="text-[8px] font-medium text-green-700">
                      AT
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-900">
                        Arthur Taylor
                      </span>
                      <span className="text-[8px] text-gray-400">
                        Yesterday at 8:30 pm
                      </span>
                    </div>
                    <p className="mt-0.5 text-[8px] text-green-600">
                      ✓ All other members took on track
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Summary Card */}
              <div className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100">
                    <span className="text-[8px]">🤖</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[8px] font-medium text-gray-500">
                      Arthur Taylor
                    </span>
                    <span className="ml-1 text-[8px] text-gray-400">
                      Yesterday at 8:30 pm
                    </span>
                    <ul className="mt-0.5 space-y-0 text-[8px] text-gray-600">
                      <li>• Automatically surface blockers,</li>
                      <li>sentiment, and key themes from daily</li>
                      <li>check-ins.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer for card overlay area */}
            <div className="h-[220px]" />

            {/* Bottom Navigation */}
            <div className="flex items-center justify-around border-t border-gray-100 bg-white px-2 py-2">
              <div className="flex flex-col items-center gap-0.5">
                <Home className="h-4 w-4 text-gray-400" />
                <span className="text-[8px] text-gray-400">Home</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-[8px] text-gray-400">My Card</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-[8px] text-blue-600">Activity</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-[8px] text-gray-400">Profile</span>
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center pb-2">
              <div className="h-1 w-24 rounded-full bg-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
