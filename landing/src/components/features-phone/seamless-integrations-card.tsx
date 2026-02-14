'use client';

import { Calendar, MessageSquare, Zap } from 'lucide-react';

type SeamlessIntegrationsCardProps = {
  className?: string;
};

export default function SeamlessIntegrationsCard({
  className = '',
}: SeamlessIntegrationsCardProps) {
  return (
    <div
      className={`w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[420px] ${className}`}
    >
      {/* Header */}
      <div className="bg-[#7c3aed] px-5 py-3.5 text-white">
        <h3 className="text-sm font-semibold">Connected Integrations</h3>
      </div>

      {/* Content */}
      <div className="space-y-4 p-5">
        {/* Slack */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#4A154B]">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Slack</p>
              <p className="text-xs text-gray-500">
                Send updates to #engineering
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">
              Connected
            </span>
          </div>
        </div>

        {/* Zapier */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FF4A00]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Zapier</p>
              <p className="text-xs text-gray-500">Automate workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">
              Connected
            </span>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#4285F4]">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Google Calendar
              </p>
              <p className="text-xs text-gray-500">Sync standup reminders</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
