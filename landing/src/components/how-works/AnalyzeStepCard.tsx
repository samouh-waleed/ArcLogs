'use client';

import { Brain, AlertTriangle, TrendingUp, Hash } from 'lucide-react';

type AnalyzeStepCardProps = {
  className?: string;
};

export default function AnalyzeStepCard({ className = '' }: AnalyzeStepCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden w-[300px] ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xs font-bold">2</span>
          </div>
          <h3 className="text-sm font-semibold">AI Analyzes Your Update</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Processing indicator */}
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
          <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
          <span className="text-xs text-purple-700 font-medium">Processing voice transcription...</span>
          <div className="ml-auto flex gap-1">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>

        {/* Detected insights */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detected Insights</p>
          
          <div className="flex items-center gap-2.5 p-2.5 bg-red-50 rounded-lg border border-red-100">
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-red-900">Blocker Detected</p>
              <p className="text-[10px] text-red-600">"Waiting for API access token"</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 bg-green-50 rounded-lg border border-green-100">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-green-900">Positive Sentiment</p>
              <p className="text-[10px] text-green-600">Confidence: 87%</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-900">Key Theme</p>
              <p className="text-[10px] text-blue-600">#api-integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}