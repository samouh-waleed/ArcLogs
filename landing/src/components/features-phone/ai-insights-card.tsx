'use client';

import { Brain, AlertTriangle, TrendingUp, Users } from 'lucide-react';

type AIInsightsCardProps = {
  className?: string;
};

export default function AIInsightsCard({ className = '' }: AIInsightsCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden w-[380px] sm:w-[420px] ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <h3 className="text-sm font-semibold">AI Insights Summary</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Blockers Detected */}
        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-900">2 Blockers Detected</p>
            <p className="text-xs text-red-600 mt-0.5">Sarah needs API access, Mike waiting on design</p>
          </div>
        </div>

        {/* Team Sentiment */}
        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Positive Sentiment</p>
            <p className="text-xs text-green-600 mt-0.5">Team morale is up 15% this week</p>
          </div>
        </div>

        {/* Key Theme */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Key Theme: Collaboration</p>
            <p className="text-xs text-blue-600 mt-0.5">3 team members mentioned cross-team work</p>
          </div>
        </div>
      </div>
    </div>
  );
}