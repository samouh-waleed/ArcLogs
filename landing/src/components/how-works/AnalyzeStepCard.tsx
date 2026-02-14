'use client';

import { AlertTriangle, Brain, Hash, TrendingUp } from 'lucide-react';

type AnalyzeStepCardProps = {
  className?: string;
};

export default function AnalyzeStepCard({
  className = '',
}: AnalyzeStepCardProps) {
  return (
    <div
      className={`w-[300px] overflow-hidden rounded-2xl bg-white shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <span className="text-xs font-bold">2</span>
          </div>
          <h3 className="text-sm font-semibold">AI Analyzes Your Update</h3>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        {/* Processing indicator */}
        <div className="flex items-center gap-2 rounded-lg bg-purple-50 p-2">
          <Brain className="h-4 w-4 animate-pulse text-purple-600" />
          <span className="text-xs font-medium text-purple-700">
            Processing voice transcription...
          </span>
          <div className="ml-auto flex gap-1">
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400"
              style={{ animationDelay: '0s' }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400"
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-400"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
        </div>

        {/* Detected insights */}
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Detected Insights
          </p>

          <div className="flex items-center gap-2.5 rounded-lg border border-red-100 bg-red-50 p-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-red-900">
                Blocker Detected
              </p>
              <p className="text-[10px] text-red-600">
                "Waiting for API access token"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-green-100 bg-green-50 p-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-green-900">
                Positive Sentiment
              </p>
              <p className="text-[10px] text-green-600">Confidence: 87%</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50 p-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
              <Hash className="h-3.5 w-3.5 text-blue-600" />
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
