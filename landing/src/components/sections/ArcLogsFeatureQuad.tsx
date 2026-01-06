'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Mic, Brain, Link2, Users } from 'lucide-react';
import PhoneWithOverlay from '@/components/features-phone/phone-with-overlay';

type FeatureItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
};

export type ArcLogsFeatureQuadProps = {
  features?: [FeatureItem, FeatureItem, FeatureItem, FeatureItem];
};

const DEFAULT_FEATURES: [FeatureItem, FeatureItem, FeatureItem, FeatureItem] = [
  {
    icon: <Mic className="h-8 w-8" />,
    title: 'Async Voice & Text',
    description: 'Team members submit updates on their own schedule, no synchronous meetings.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <Link2 className="h-8 w-8" />,
    title: 'Seamless Integrations',
    description: 'Connect with Slack, Zapier, and your existing workflow tools easily.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <Brain className="h-8 w-8" />,
    title: 'AI-Powered Insights',
    description: 'Automatically surface blockers, sentiment, and key themes from daily check-ins.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Stay Aligned, Async',
    description: 'Keep everyone on the same page and free up hours for deep work.',
    color: 'bg-blue-100 text-blue-600',
  },
];

export default function ArcLogsFeatureQuad({
  features = DEFAULT_FEATURES,
}: ArcLogsFeatureQuadProps) {
  const [active, setActive] = React.useState(0);

  const left = features.slice(0, 2);
  const right = features.slice(2, 4);

  const FeatureCard = ({ feature, index, isActive }: { feature: FeatureItem; index: number; isActive: boolean }) => (
    <button
      onClick={() => setActive(index)}
      className="w-full max-w-[280px] py-4 text-center transition-all focus:outline-none"
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl px-4 py-6 transition-all',
          isActive
            ? 'bg-gray-50 border border-gray-200 shadow-sm'
            : 'border border-transparent bg-transparent hover:bg-gray-50/50',
        )}
      >
        {/* Icon */}
        <div className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
          feature.color || 'bg-blue-100 text-blue-600'
        )}>
          {feature.icon}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900">
          {feature.title}
        </h3>
        
        {/* Description */}
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          {feature.description}
        </p>
      </div>
    </button>
  );

  return (
    <section className="px-6 py-10 lg:py-24">
      <div className="container">
        <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white px-6 py-10 shadow-sm lg:px-8">
          
          {/* Mobile Layout */}
          <div className="flex flex-col items-center gap-6 lg:hidden">
            {/* Features Grid on Mobile */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {features.map((f, i) => (
                <FeatureCard key={i} feature={f} index={i} isActive={active === i} />
              ))}
            </div>
            
            {/* Phone Mockup */}
            <div className="mt-6 w-full flex justify-center">
              <PhoneWithOverlay activeIndex={active} />
            </div>
          </div>

          {/* Desktop Layout - 3 columns */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4 xl:gap-8">
            {/* Left Features */}
            <div className="flex flex-col items-center divide-y divide-gray-100">
              {left.map((f, idx) => (
                <FeatureCard key={idx} feature={f} index={idx} isActive={active === idx} />
              ))}
            </div>

            {/* Center - Phone with Overlay */}
            <div className="flex justify-center px-4 min-w-[420px]">
              <PhoneWithOverlay activeIndex={active} />
            </div>

            {/* Right Features */}
            <div className="flex flex-col items-center divide-y divide-gray-100">
              {right.map((f, idx) => {
                const actualIndex = idx + 2;
                return (
                  <FeatureCard key={actualIndex} feature={f} index={actualIndex} isActive={active === actualIndex} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}