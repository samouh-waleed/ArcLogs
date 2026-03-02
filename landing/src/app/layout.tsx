import './globals.css';

import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { ThemeProvider } from '@/components/theme-provider';

const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/satoshi/Satoshi-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi/Satoshi-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/satoshi/Satoshi-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});
export const metadata: Metadata = {
  title: {
    default: 'ArcLogs - Async Standups for Engineering Teams',
    template: '%s | ArcLogs',
  },
  description:
    'Eliminate daily meetings with async voice and text updates. Save 5+ hours per week while keeping your engineering team aligned.',
  keywords: [
    'ArcLogs',
    'Async Standups',
    'Engineering Management',
    'Remote Teams',
    'AI Status Updates',
    'Developer Productivity',
  ],
  authors: [{ name: 'ArcLogs Team' }],
  creator: 'ArcLogs Team',
  publisher: 'ArcLogs Team',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/images/layout/image.png', sizes: '32x32' },
      { url: '/images/layout/image.png', sizes: 'any' }, // Fallback
    ],
    apple: [{ url: '/images/layout/image.png', sizes: '180x180' }],
    shortcut: [{ url: '/images/layout/image.png' }],
  },
  openGraph: {
    title: 'ArcLogs - Skip the Standup, Keep the Alignment',
    description:
      'The intelligence layer for technical workspaces that converts async updates into actionable insights.',
    siteName: 'ArcLogs',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Zippay - Modern Next.js Template',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArcLogs - Async Standups',
    description: 'Eliminate meetings. Keep alignment.',
    creator: '@arclogs',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`h-screen ${satoshi.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="zippay-theme"
          disableTransitionOnChange
        >
          <Navbar />
          <main>{children}</main>
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
