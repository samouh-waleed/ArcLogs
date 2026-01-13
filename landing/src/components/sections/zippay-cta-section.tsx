'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CTAProps = {
  title?: string;
  description?: string;
  patternSrc?: string;
};

export default function ZippayCtaSection({
  title = 'Ready to reclaim your time?',
  description = `Join engineering teams that have switched to ArcLogs and stopped wasting hours in meetings.`,
  patternSrc = '/images/homepage/cta/pattern.webp',
}: CTAProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for joining! Check your email for confirmation.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <section
      id="waitlist"
      className="bg-primary-300 relative overflow-hidden px-6 py-10 text-white lg:py-26"
    >
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <Image
          src={patternSrc}
          alt=""
          fill
          priority
          className="object-cover opacity-20"
        />
      </div>

      <div className="relative z-10 container text-center">
        <h2 className="text-heading-1 mx-auto max-w-[637px] tracking-tight lg:text-[52px]">
          {title}
        </h2>

        <p className="text-body-md sm:text-body-lg mx-auto mt-5 max-w-3xl text-white">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              className="flex-1 border-white bg-white text-gray-900 placeholder:text-gray-500"
            />
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 sm:w-auto"
            >
              {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </div>

          {message && (
            <p
              className={`mt-4 text-sm ${status === 'success' ? 'text-green-100' : 'text-red-200'}`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
