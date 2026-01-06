'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HeroIllustration from '@/components/hero-section/HeroIllustration';

export default function ArcLogsHero() {
  const SIGNIN_URL = 'https://app.arclogs.com/login';
  
  return (
    <section
      id="arclogs-hero"
      className="bg-background relative min-h-[640px] overflow-hidden px-6"
    >
      {/* Brand Blue Sidebar Background */}
      <div
        className="bg-primary-300 absolute inset-y-0 right-0 z-0 hidden overflow-hidden lg:block"
        style={{
          left: 'max(0px, calc((100vw - 1200px) / 2 + 780px))',
        }}
      />
      
      <div className="relative z-10">
        <div className="relative container">
          <div className="grid pt-10 lg:[grid-template-columns:minmax(0,1fr)_clamp(420px,40vw,520px)] lg:gap-16 lg:py-24">
            {/* Left Side - Text Content */}
            <div className="flex flex-col justify-center gap-8 pb-6">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col items-start gap-4">
                  {/* Product Tagline */}
                  <span className="text-body-sm-medium bg-white inline-flex h-8 w-fit items-center justify-center gap-2 rounded-[10px] px-3 leading-none whitespace-nowrap shadow-md">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Distributed Team Alignment
                  </span>
                  
                  {/* Main Headline */}
                  <h1 className="text-foreground text-heading-1 leading-[1.05] font-bold tracking-tight lg:text-[68px] lg:leading-[115%]">
                    Skip the standup. <br />
                    Keep the alignment.
                  </h1>
                  
                  {/* Core Value Proposition */}
                  <p className="text-body-lg max-w-xl text-gray-500">
                    ArcLogs is an async standup platform that replaces daily
                    meetings with voice or text check-ins, saving your team 5+
                    hours every week.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button
                    asChild
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90"
                    aria-label="Get Started"
                  >
                    <Link href={SIGNIN_URL}>Get Started</Link>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Right Side - Card Illustrations */}
            <div className="min-w-0">
              <div className="relative">
                {/* Mobile Background Accent */}
                <div className="bg-primary-300 absolute inset-y-0 left-1/2 z-0 w-screen -translate-x-1/2 lg:hidden" />
                
                <div className="relative z-10 flex w-full justify-center py-6 lg:justify-start lg:py-0">
                  <HeroIllustration className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}