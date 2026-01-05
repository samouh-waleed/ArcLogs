// app/(auth)/layout.tsx
import type { Metadata } from "next";
import React from "react";
import { Inter } from "next/font/google";
import "../globals.css";
import { QueryProvider } from "@/components/providers/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arc Logs - Async Standups with AI Insights",
  description: "Skip the standup. Keep the alignment.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <main className="min-h-screen bg-gray-50">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
