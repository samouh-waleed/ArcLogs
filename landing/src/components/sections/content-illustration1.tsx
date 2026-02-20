'use client';

import { motion } from 'framer-motion';
import * as React from 'react';

import AIInsightsCard from '@/components/feature-cards/AIInsightsCard';
import DailyStandupCard from '@/components/feature-cards/DailyStandupCard';
import TeamActivityCard from '@/components/feature-cards/TeamActivityCard';

export default function ContentIllustration({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto min-h-[450px] w-full max-w-[480px] ${className}`}
    >
      <div className="relative aspect-[4/3.5] w-full">
        {/* Top Card - Daily Standup (Base Anchor) */}
        <motion.div
          className="absolute top-[10%] left-0 z-10 w-[65%]"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <DailyStandupCard className="shadow-2xl" />
        </motion.div>

        {/* Middle Card - AI Insights (Placed UNDER the Daily card) */}
        <motion.div
          /* - Positioned specifically under the Daily card using top-[45%]
             - Kept at z-30 to maintain the 'popout' effect over other elements
          */
          className="absolute top-[45%] left-[50%] z-30 w-[60%]"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <AIInsightsCard className="border-none shadow-2xl" />
        </motion.div>

        {/* Bottom Card - Team Activity (Pushed UP closer to the cluster) */}
        <motion.div
          /* - Pushed up by changing bottom from [10%] to [22%]
             - Shifted to the right to balance the left-heavy top section
          */
          className="absolute right-[40%] bottom-[20%] z-20 w-[50%]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <TeamActivityCard className="border-none shadow-2xl" />
        </motion.div>
      </div>
    </div>
  );
}
