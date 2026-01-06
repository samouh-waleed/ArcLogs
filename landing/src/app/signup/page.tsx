'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  return (
    <section className="bg-primary-300 min-h-[820px] px-6 py-10 text-white lg:py-24">
      <div className="container mx-auto flex max-w-[400px] flex-col items-center justify-center py-10">
        <Link href="/" aria-label="Zippay home" className="mb-5">
          <Image
            src="/images/logos/white.svg"
            alt="logo light"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
        </Link>

        <div className="w-full text-center">
          <h1 className="text-2xl leading-tight font-semibold">
            Welcome to Zippay!
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Please enter your details to create your account
          </p>
        </div>

        <div className="mt-8 w-full space-y-4">
          <Button
            type="button"
            className="bg-gray-0/10 hover:bg-gray-0/15 w-full border border-white/15 text-white"
            variant="secondary"
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <Button
            type="button"
            className="bg-gray-0/10 hover:bg-gray-0/15 w-full border border-white/15 text-white"
            variant="secondary"
          >
            <FaXTwitter className="mr-2 h-4 w-4" />
            Continue with Twitter
          </Button>
        </div>

        <div className="relative my-5 flex w-full items-center justify-center">
          <span className="bg-gray-0/15 h-px w-full" />
          <span className="mx-3 text-xs tracking-wide text-white/80 uppercase">
            or
          </span>
          <span className="bg-gray-0/15 h-px w-full" />
        </div>

        <form
          className="w-full space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Input
            type="email"
            placeholder="Email"
            className="bg-gray-0/10 h-11 rounded-[12px] border border-white/15 text-white placeholder:text-white/60 focus-visible:ring-white/20"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            className="bg-gray-0/10 h-11 rounded-[12px] border border-white/15 text-white placeholder:text-white/60 focus-visible:ring-white/20"
            required
          />
          <Input
            type="password"
            placeholder="Repeat Password"
            className="bg-gray-0/10 h-11 rounded-[12px] border border-white/15 text-white placeholder:text-white/60 focus-visible:ring-white/20"
            required
          />

          <Button type="submit" className="mt-2 w-full text-gray-900">
            Continue with Email
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-white/80">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-white underline underline-offset-4"
          >
            Sign In
          </Link>
        </p>
      </div>
    </section>
  );
}
