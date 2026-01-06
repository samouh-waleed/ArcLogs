'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import BlockerReportCard from '../insight-cards/BlockerReportCard';
import SentimentAnalysisCard from '../insight-cards/SentimentAnalysisCard';
import KeyThemesCard from '../insight-cards/KeyThemesCard';

export default function ContentIllustration2({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full max-w-[600px] mx-auto pt-10 min-h-[550px] ${className}`}>
      
      {/* Light Blue Background Panel - Holds all three cards */}
      <div 
        className="absolute left-[10%] top-0 w-[90%] h-full bg-[#f0f7ff] rounded-[2rem] -z-10 shadow-sm" 
      />

      {/* 1. Blocker Report Card - Positioned lower within the panel */}
      <motion.div
        className="absolute left-[12%] top-[12%] z-20 w-full max-w-[280px]"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <BlockerReportCard />
      </motion.div>

      {/* 2. Sentiment Analysis Card - Shifted right with popout shadow */}
      <motion.div
        className="absolute right-[-8%] top-[45%] z-30 w-full max-w-[240px]"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <SentimentAnalysisCard />
      </motion.div>

      {/* 3. Key Themes Card - Bottom-left staggered position */}
      <motion.div
        className="absolute left-[-5%] bottom-[8%] z-40 w-full max-w-[210px]"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <KeyThemesCard />
      </motion.div>
    </div>
  );
}