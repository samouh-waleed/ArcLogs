// app/(dashboard)/layout.tsx
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50/50">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto pt-16 lg:pt-0">
        <div className="container mx-auto max-w-7xl p-4 md:p-8 lg:p-10 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
