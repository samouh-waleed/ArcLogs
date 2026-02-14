'use client';

import { AnimatePresence, motion } from 'framer-motion';

import AIInsightsCard from './ai-insights-card';
import AsyncVoiceTextCard from './async-voice-text-card';
import PhoneMockup from './phone-mockup';
import SeamlessIntegrationsCard from './seamless-integrations-card';
import StayAlignedCard from './stay-aligned-card';

type PhoneWithOverlayProps = {
  className?: string;
  activeIndex?: number;
};

export default function PhoneWithOverlay({
  className = '',
  activeIndex = 0,
}: PhoneWithOverlayProps) {
  const cards = [
    <AsyncVoiceTextCard key="async" />,
    <SeamlessIntegrationsCard key="integrations" />,
    <AIInsightsCard key="insights" />,
    <StayAlignedCard key="aligned" />,
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Phone */}
      <div className="relative">
        <PhoneMockup />
      </div>

      {/* Floating Card Overlay - switches based on activeIndex */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          className="absolute top-[50%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {cards[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
