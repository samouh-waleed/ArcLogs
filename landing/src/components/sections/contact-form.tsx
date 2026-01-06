'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ZippayContactFormProps = {
  tagline?: string;
  title?: string;
  description?: string;
  className?: string;
  onSubmit?: (data: {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
    confirm: boolean;
  }) => void;
};

export default function ZippayContactForm({
  tagline = 'Contact Us',
  title = 'We’d Love to Hear From You',
  description = `Share your thoughts, suggestions, or any questions you may have with us. 
Your input helps us improve and enhance our services to better meet your needs.`,
  className,
  onSubmit,
}: ZippayContactFormProps) {
  // 1. Add state for submission status
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      firstName: String(fd.get('firstName') || ''),
      lastName: String(fd.get('lastName') || ''),
      email: String(fd.get('email') || ''),
      message: String(fd.get('message') || ''),
      confirm: fd.get('confirm') === 'on',
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        setIsSubmitted(true); // Trigger the success UI
        form.reset();
      } else {
        console.error('Submission failed:', result.error);
        alert(`Error: ${result.error || 'Something went wrong'}`);
      }
    } catch (err) {
      console.error('Network Error:', err);
      alert('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }

    onSubmit?.(payload);
  }

  const inputCls =
    'h-11 w-full rounded-[12px] border border-gray-100 bg-gray-0 px-3 text-sm text-gray-700 outline-none focus:border-gray-200 focus:ring-2 focus:ring-primary/30 disabled:opacity-50';
  const labelCls = 'text-body-sm-medium text-gray-700';

  return (
    <section className={cn('bg-gray-25 px-6 py-10 lg:py-24 dark:bg-gray-200', className)}>
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-body-sm-medium text-primary-200">{tagline}</span>
          <h2 className="text-heading-1 text-foreground mt-4 tracking-tight lg:text-[52px]">
            {title}
          </h2>
          <p className="text-body-md sm:text-body-lg mt-4 text-gray-500">
            {description}
          </p>
        </div>

        <div className="bg-gray-0 mx-auto mt-8 max-w-4xl rounded-2xl border border-gray-50 p-5 shadow-[0_4px_11px_-1px_rgba(10,10,10,0.04)] sm:p-6 lg:mt-10 lg:p-8 min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form
                key="contact-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className={labelCls}>First name</label>
                    <input id="firstName" name="firstName" required placeholder="John" className={inputCls} disabled={isSubmitting} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelCls}>Last name</label>
                    <input id="lastName" name="lastName" required placeholder="Doe" className={inputCls} disabled={isSubmitting} />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={labelCls}>Email</label>
                  <input id="email" name="email" type="email" required placeholder="johndoe@mail.com" className={inputCls} disabled={isSubmitting} />
                </div>

                <div>
                  <label htmlFor="message" className={labelCls}>Problem Descriptions</label>
                  <textarea id="message" name="message" placeholder="Message" className={cn(inputCls, 'min-h-[180px] resize-y py-3 leading-6')} disabled={isSubmitting} />
                </div>

                <label className="flex items-center gap-2">
                  <input type="checkbox" name="confirm" className="text-primary focus:ring-primary/30 h-4 w-4 rounded border-gray-300 outline-none focus:ring-2" />
                  <span className="text-body-sm text-gray-600">I agree to the privacy policy</span>
                </label>

                <div className="pt-1">
                  <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </motion.form>
            ) : (
              // 2. Beautiful Success UI that matches your ArcLogs style
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Message Received!</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">
                    Thanks for reaching out. Our team will review your message and get back to you shortly.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 gap-2"
                >
                  Send another message <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}