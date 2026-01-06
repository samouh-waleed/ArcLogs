'use client';

import { motion } from 'framer-motion';
import HowItWorksIllustration from '@/components/how-works/HowItWorksIllustration';

export default function HowItWorksSection() {
  return (
    <section className="bg-background relative overflow-hidden px-6 py-16 lg:py-24">
      <div className="container">
        <div className="grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Side - Text Content */}
          <motion.div
            className="flex flex-col gap-6 mb-10 lg:mb-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <span className="text-body-sm-medium bg-white inline-flex h-8 w-fit items-center justify-center gap-2 rounded-[10px] px-3 leading-none whitespace-nowrap shadow-md border border-gray-100">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              How It Works
            </span>

            {/* Headline */}
            <h2 className="text-foreground text-heading-1 leading-[1.1] font-bold tracking-tight lg:text-[52px]">
              From Update to Insight in Minutes
            </h2>

            {/* Description */}
            <p className="text-body-lg text-gray-500 max-w-lg">
              No meetings, no scheduling conflicts. Just seamless async updates that keep everyone aligned.
            </p>

            {/* Steps list */}
            <div className="space-y-4 mt-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Record or Type</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Team members submit voice or text updates in under 2 minutes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">AI Analyzes</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Automatic transcription, blocker detection & sentiment analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Team Stays Aligned</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Digest sent, blockers routed, follow-ups automated
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Card Illustrations */}
          <div className="relative">
            <HowItWorksIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}