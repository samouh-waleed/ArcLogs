'use client';

import { motion } from 'framer-motion';
import RecordStepCard from './RecordStepCard';
import AnalyzeStepCard from './AnalyzeStepCard';
import AlignStepCard from './AlignStepCard';

export default function HowItWorksIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Desktop Layout - Zigzag around central dashed line */}
      <div className="relative min-h-[600px] hidden lg:block w-full max-w-[800px] mx-auto">
        
        {/* Central Dashed Line */}
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 border-l-2 border-dashed border-gray-200 z-0" />

        {/* Step 1 - RECORD (Left of line) */}
        <motion.div
          className="absolute top-0 right-[50%] mr-8 z-10"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <RecordStepCard />
        </motion.div>

        {/* Step 2 - ANALYZE (Right of line) */}
        <motion.div
          className="absolute top-[180px] left-[50%] ml-8 z-20"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AnalyzeStepCard />
        </motion.div>

        {/* Step 3 - ALIGN (Left of line) */}
        <motion.div
          className="absolute top-[360px] right-[50%] mr-8 z-30"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <AlignStepCard />
        </motion.div>
      </div>

      {/* Mobile Layout - Vertical stack */}
      <div className="flex flex-col items-center gap-6 lg:hidden py-4">
        <RecordStepCard />
        <AnalyzeStepCard />
        <AlignStepCard />
      </div>
    </div>
  );
}