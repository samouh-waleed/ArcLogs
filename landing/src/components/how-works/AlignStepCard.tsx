'use client';

import { Users, Bell, MessageSquare, GitPullRequest, CheckCircle2 } from 'lucide-react';

type AlignStepCardProps = {
  className?: string;
};

export default function AlignStepCard({ className = '' }: AlignStepCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden w-[300px] ${className}`}>
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xs font-bold">3</span>
          </div>
          <h3 className="text-sm font-semibold">Team Stays Aligned</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Daily Digest Sent</p>
            <p className="text-xs text-gray-500">8 team members notified</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto Follow-ups</p>
          
          <div className="flex items-center gap-2.5 p-2 bg-purple-50 rounded-lg">
            <div className="w-6 h-6 rounded bg-[#4A154B] flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs text-gray-700 flex-1">Blocker routed to #engineering</p>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>

          <div className="flex items-center gap-2.5 p-2 bg-gray-100 rounded-lg">
            <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center">
              <GitPullRequest className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs text-gray-700 flex-1">PR reminder sent to Mike</p>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
          <Users className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">Everyone aligned, zero meetings</span>
        </div>
      </div>
    </div>
  );
}