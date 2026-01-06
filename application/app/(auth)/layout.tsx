// app/(auth)/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - ArcLogs",
  description: "Sign in to your ArcLogs account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 to-primary/10">
      {children}
    </div>
  );
}
