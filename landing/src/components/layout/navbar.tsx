'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMenuOpen]);

  const ITEMS = [
    { label: 'Product', href: '/' },
    { label: 'Pricing', href: '/pricing' },
    // { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ];

  const bgColor = 'bg-background';

  return (
    <header
      className={cn(
        'relative z-50 h-16 border-b border-b-gray-50 px-2.5 lg:h-22 lg:px-0',
        bgColor,
      )}
    >
      <div className="container flex h-16 items-center lg:h-22">
        <div className="flex w-full items-center justify-between px-3.5 lg:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/layout/black_logo.jpg"
              alt="logo"
              width={129}
              height={32}
              className="invert-0 dark:invert"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center justify-center">
            <NavigationMenu className="mr-4 hidden items-center gap-8 lg:flex">
              <NavigationMenuList>
                {ITEMS.map((link) => (
                  <NavigationMenuItem key={link.label}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-foreground hover:text-muted-foreground text-body-sm-medium p-2',
                      )}
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          {/* Auth Buttons */}
          <div className="flex items-center gap-2.5">
            {/* ThemeToggle removed as requested */}

            <Link href="/login" className="hidden lg:block">
              <Button size="sm" variant="secondary">
                Sign In
              </Button>
            </Link>
            <Link href="#waitlist" className="hidden lg:block">
              {/* Added text-white to enforce white font color */}
              <Button size="sm" className="text-white">
                Join Waitlist
              </Button>
            </Link>

            {/* Hamburger Menu Button (Mobile Only) */}
            <button
              className="text-muted-foreground relative flex size-8 lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <div className="absolute top-1/2 left-1/2 block w-[18px] -translate-x-1/2 -translate-y-1/2">
                <span
                  aria-hidden="true"
                  className={`absolute block h-0.5 w-full rounded-full bg-gray-900 transition duration-500 ease-in-out ${isMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}
                ></span>
                <span
                  aria-hidden="true"
                  className={`absolute block h-0.5 w-full rounded-full bg-gray-900 transition duration-500 ease-in-out ${isMenuOpen ? 'opacity-0' : ''}`}
                ></span>
                <span
                  aria-hidden="true"
                  className={`absolute block h-0.5 w-full rounded-full bg-gray-900 transition duration-500 ease-in-out ${isMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'absolute inset-x-0 top-full container flex h-[calc(100vh-64px)] flex-col px-2.5 lg:px-0',
          'transition duration-300 ease-in-out lg:hidden',
          isMenuOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-full opacity-0',
          bgColor,
        )}
      >
        <div className="flex h-[calc(100vh-80px)] flex-col px-5">
          <nav className="mt-6 flex flex-1 flex-col gap-6">
            {ITEMS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'text-foreground text-body-lg-medium tracking-[-0.36px]',
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pb-20 sm:flex-row sm:gap-4">
              <Link href="/login">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="#waitlist">
                <Button
                  className="w-full text-white"
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                >
                  Join Waitlist
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
