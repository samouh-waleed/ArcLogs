// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/provider";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arc Logs - Async Standups with AI Insights",
  description: "Skip the standup. Keep the alignment.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full overflow-hidden`}>
        <QueryProvider>
          <div className="flex h-screen w-full overflow-hidden bg-gray-50/50">
            <Sidebar />

            <main className="flex-1 min-w-0 overflow-y-auto pt-16 lg:pt-0">
              <div className="container mx-auto max-w-7xl p-4 md:p-8 lg:p-10 animate-in fade-in duration-500">
                {children}
              </div>
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
