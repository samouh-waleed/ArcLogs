'use client';

import { Bot, MessageSquare, GitPullRequestDraft, Send } from 'lucide-react';

type AIAutomationHeroCardProps = {
  className?: string;
};

export default function AIAutomationHeroCard({ className = '' }: AIAutomationHeroCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl p-4 w-[300px] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">AI Auto Follow-ups</h3>
      </div>

      {/* Automation Actions */}
      <div className="space-y-2.5">
        {/* Slack Message */}
        <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex-shrink-0 w-6 h-6 rounded bg-[#4A154B] flex items-center justify-center mt-0.5">
            <MessageSquare className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">Slack → Sarah</p>
            <p className="text-[11px] text-gray-500 mt-0.5">"Hey! Need help with that access token blocker?"</p>
          </div>
          <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
        </div>

        {/* GitHub PR Comment */}
        <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex-shrink-0 w-6 h-6 rounded bg-gray-900 flex items-center justify-center mt-0.5">
            <GitPullRequestDraft className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">GitHub → PR #142</p>
            <p className="text-[11px] text-gray-500 mt-0.5">"Reminder: Mike's PR awaiting review"</p>
          </div>
          <Send className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">Auto-triggered by AI</span>
          <span className="text-[10px] text-green-600 font-medium">2 actions sent</span>
        </div>
      </div>
    </div>
  );
}