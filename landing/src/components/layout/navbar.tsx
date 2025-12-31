'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

import { ThemeToggle } from '../theme-toggle';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
    {
      label: 'Product',
      href: '#product',
      dropdownItems: [
        {
          title: 'Feature - AI Efficiency',
          href: '/feature1',
        },
        { title: 'Feature - Spend Management', href: '/feature2' },
      ],
    },
    { label: 'Integrations', href: '/integrations' },
    { label: 'About us', href: '/about' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    {
      label: 'Blog',
      href: '/blog',
    },
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
              src="/images/layout/logo.svg"
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
                {ITEMS.map((link) =>
                  link.dropdownItems ? (
                    <NavigationMenuItem
                      key={link.label}
                      className="text-body-sm-medium"
                    >
                      <NavigationMenuTrigger
                        className={cn(
                          'text-foreground text-body-sm-medium bg-transparent',
                          'hover:bg-transparent focus:bg-transparent active:bg-transparent',
                          'hover:text-muted-foreground focus:text-muted-foreground',
                          'data-[state=open]:text-muted-foreground data-[state=open]:bg-transparent',
                          'transition-none',
                        )}
                      >
                        {link.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent
                        className={cn('bg-gray-0 rounded-2xl')}
                      >
                        <ul className="bg-gray-0 w-[400px] p-3">
                          {link.dropdownItems.map((item) => (
                            <li key={item.title}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={item.href}
                                  className="hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center rounded-xl p-3 leading-none no-underline outline-hidden transition-colors select-none hover:bg-gray-50"
                                >
                                  <div className="flex gap-2">
                                    <div className="space-y-1.5">
                                      <div className="text-foreground text-body-sm-medium leading-none font-medium">
                                        {item.title}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
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
                  ),
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          {/* Auth Buttons */}
          <div className="flex items-center gap-2.5">
            <div
              className={`transition-opacity duration-300 ${isMenuOpen ? 'max-lg:pointer-events-none max-lg:opacity-0' : 'opacity-100'}`}
            >
              <ThemeToggle />
            </div>
            <Link href="/login" className="hidden lg:block">
              <Button size="sm" variant="secondary">
                Sign In
              </Button>
            </Link>
            <Link href="/login" className="hidden lg:block">
              <Button size="sm">Get Started</Button>
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
            {ITEMS.map((link) =>
              link.dropdownItems ? (
                <div key={link.label} className="">
                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === link.label ? null : link.label,
                      )
                    }
                    className="text-foreground text-body-lg-medium flex w-full items-center justify-between tracking-[-0.36px]"
                    aria-label={`${link.label} menu`}
                    aria-expanded={openDropdown === link.label}
                  >
                    {link.label}
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        openDropdown === link.label ? 'rotate-90' : '',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className={cn(
                      'ml-1 space-y-3 overflow-hidden border-b border-b-gray-50 transition-all',
                      openDropdown === link.label
                        ? 'mt-3 max-h-[1000px] pb-6 opacity-100'
                        : 'max-h-0 opacity-0',
                    )}
                  >
                    {link.dropdownItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => {
                          setIsMenuOpen(false);
                          setOpenDropdown(null);
                        }}
                        className="hover:bg-accent flex items-start gap-3 rounded-xl p-2"
                      >
                        <div>
                          <div className="text-foreground font-medium">
                            {item.title}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
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
              ),
            )}
            <div className="flex flex-col gap-3 pb-20 sm:flex-row sm:gap-4">
              <Link href="/login">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setOpenDropdown(null);
                  }}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  className="w-full"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setOpenDropdown(null);
                  }}
                >
                  Get Started
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
