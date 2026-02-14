'use client';

import {
  Bell,
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  Users,
} from 'lucide-react';

type AlignStepCardProps = {
  className?: string;
};

export default function AlignStepCard({ className = '' }: AlignStepCardProps) {
  return (
    <div
      className={`w-[300px] overflow-hidden rounded-2xl bg-white shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="bg-green-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <span className="text-xs font-bold">3</span>
          </div>
          <h3 className="text-sm font-semibold">Team Stays Aligned</h3>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <Bell className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Daily Digest Sent
            </p>
            <p className="text-xs text-gray-500">8 team members notified</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Auto Follow-ups
          </p>

          <div className="flex items-center gap-2.5 rounded-lg bg-purple-50 p-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#4A154B]">
              <MessageSquare className="h-3 w-3 text-white" />
            </div>
            <p className="flex-1 text-xs text-gray-700">
              Blocker routed to #engineering
            </p>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>

          <div className="flex items-center gap-2.5 rounded-lg bg-gray-100 p-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-900">
              <GitPullRequest className="h-3 w-3 text-white" />
            </div>
            <p className="flex-1 text-xs text-gray-700">
              PR reminder sent to Mike
            </p>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-2">
          <Users className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">
            Everyone aligned, zero meetings
          </span>
        </div>
      </div>
    </div>
  );
}
