'use client';

import { Bot, GitPullRequestDraft, MessageSquare, Send } from 'lucide-react';

type AIAutomationHeroCardProps = {
  className?: string;
};

export default function AIAutomationHeroCard({
  className = '',
}: AIAutomationHeroCardProps) {
  return (
    <div
      className={`w-[300px] rounded-2xl bg-white p-4 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">AI Auto Follow-ups</h3>
      </div>

      {/* Automation Actions */}
      <div className="space-y-2.5">
        {/* Slack Message */}
        <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-[#4A154B]">
            <MessageSquare className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">Slack → Sarah</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              "Hey! Need help with that access token blocker?"
            </p>
          </div>
          <Send className="mt-1 h-3 w-3 flex-shrink-0 text-green-500" />
        </div>

        {/* GitHub PR Comment */}
        <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-900">
            <GitPullRequestDraft className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">
              GitHub → PR #142
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              "Reminder: Mike's PR awaiting review"
            </p>
          </div>
          <Send className="mt-1 h-3 w-3 flex-shrink-0 text-green-500" />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="text-[10px] text-gray-400">
            Auto-triggered by AI
          </span>
          <span className="text-[10px] font-medium text-green-600">
            2 actions sent
          </span>
        </div>
      </div>
    </div>
  );
}
