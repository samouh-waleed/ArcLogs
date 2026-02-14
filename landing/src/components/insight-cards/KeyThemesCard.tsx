// landing/src/components/insight-cards/KeyThemesCard.tsx
'use client';

import { GitPullRequest, PenTool, Settings } from 'lucide-react';

export default function KeyThemesCard({
  className = '',
}: {
  className?: string;
}) {
  const themes = [
    {
      icon: GitPullRequest,
      label: 'PR Reviews',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Settings,
      label: 'Environment Setup',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      icon: PenTool,
      label: 'Design Handoff',
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ];

  return (
    <div
      className={`w-full max-w-[200px] rounded-xl bg-white p-4 shadow-2xl ${className}`}
    >
      <h3 className="mb-4 text-xs font-semibold text-gray-900">Key Themes</h3>

      <div className="space-y-3">
        {themes.map((theme, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`rounded-md p-1.5 ${theme.bg}`}>
              <theme.icon className={`h-3 w-3 ${theme.color}`} />
            </div>
            <span className="text-xs font-medium text-gray-600">
              {theme.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
