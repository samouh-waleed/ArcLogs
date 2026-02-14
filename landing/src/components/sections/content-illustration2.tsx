'use client';

import { motion } from 'framer-motion';
import * as React from 'react';

import BlockerReportCard from '../insight-cards/BlockerReportCard';
import KeyThemesCard from '../insight-cards/KeyThemesCard';
import SentimentAnalysisCard from '../insight-cards/SentimentAnalysisCard';

export default function ContentIllustration2({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto min-h-[550px] w-full max-w-[600px] pt-10 ${className}`}
    >
      {/* Light Blue Background Panel - Holds all three cards */}
      <div className="absolute top-0 left-[10%] -z-10 h-full w-[90%] rounded-[2rem] bg-[#f0f7ff] shadow-sm" />

      {/* 1. Blocker Report Card - Positioned lower within the panel */}
      <motion.div
        className="absolute top-[12%] left-[12%] z-20 w-full max-w-[280px]"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <BlockerReportCard />
      </motion.div>

      {/* 2. Sentiment Analysis Card - Shifted right with popout shadow */}
      <motion.div
        className="absolute top-[45%] right-[-8%] z-30 w-full max-w-[240px]"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <SentimentAnalysisCard />
      </motion.div>

      {/* 3. Key Themes Card - Bottom-left staggered position */}
      <motion.div
        className="absolute bottom-[8%] left-[-5%] z-40 w-full max-w-[210px]"
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
