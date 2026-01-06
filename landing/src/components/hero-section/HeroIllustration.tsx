'use client';

import { motion } from 'framer-motion';
import DailyStandupHeroCard from './DailyStandupHeroCard';
import KeyInsightsHeroCard from './KeyInsightsHeroCard';
import AIAutomationHeroCard from './AIAutomationHeroCard';

type HeroIllustrationProps = {
  className?: string;
};

export default function HeroIllustration({ className = '' }: HeroIllustrationProps) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Cards Container - stacked on mobile, absolute positioning on desktop */}
      
      {/* Mobile Layout - stacked vertically */}
      <div className="flex flex-col items-center gap-4 lg:hidden py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1 
          }}
        >
          <DailyStandupHeroCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.3 
          }}
        >
          <KeyInsightsHeroCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.5 
          }}
        >
          <AIAutomationHeroCard />
        </motion.div>
      </div>

      {/* Desktop Layout - absolute positioning (unchanged) */}
      <div className="relative min-h-[520px] hidden lg:block">
        
        {/* Daily Standup Card - Main card, top left */}
        <motion.div
          className="absolute top-0 left-0 z-10"
          initial={{ opacity: 0, x: -20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1 
          }}
        >
          <DailyStandupHeroCard />
        </motion.div>

        {/* Key Insights Card - Right side, overlapping main card */}
        <motion.div
          className="absolute top-[200px] right-0 z-20"
          initial={{ opacity: 0, x: 20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.3 
          }}
        >
          <KeyInsightsHeroCard />
        </motion.div>

        {/* AI Automation Card - Bottom, slightly left */}
        <motion.div
          className="absolute top-[350px] left-[450px] z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.5 
          }}
        >
          <AIAutomationHeroCard />
        </motion.div>
      </div>
    </div>
  );
}