'use client';

import { MessageSquare, Zap, Calendar } from 'lucide-react';

type SeamlessIntegrationsCardProps = {
  className?: string;
};

export default function SeamlessIntegrationsCard({ className = '' }: SeamlessIntegrationsCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden w-[380px] sm:w-[420px] ${className}`}>
      {/* Header */}
      <div className="bg-[#7c3aed] text-white px-5 py-3.5">
        <h3 className="text-sm font-semibold">Connected Integrations</h3>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Slack */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#4A154B] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Slack</p>
              <p className="text-xs text-gray-500">Send updates to #engineering</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600 font-medium">Connected</span>
          </div>
        </div>

        {/* Zapier */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FF4A00] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Zapier</p>
              <p className="text-xs text-gray-500">Automate workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600 font-medium">Connected</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#4285F4] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Google Calendar</p>
              <p className="text-xs text-gray-500">Sync standup reminders</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600 font-medium">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}