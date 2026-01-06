// landing/src/components/insight-cards/BlockerReportCard.tsx
'use client';

type BlockerReportCardProps = {
  className?: string;
};

export default function BlockerReportCard({
  className = '',
}: BlockerReportCardProps) {
  const bars = [25, 35, 15, 45, 20, 30, 25]; // Mock data heights

  return (
    <div
      className={`bg-white rounded-xl shadow-2xl p-4 w-full max-w-[280px] ${className}`}
    >
      <h3 className="mb-4 text-xs font-semibold text-gray-900">
        Blocker Report
      </h3>

      <div className="relative flex h-32 items-end justify-between gap-2 px-1">
        {/* Tooltip for the critical issue */}
        <div className="absolute top-0 left-[45%] z-10 -translate-x-1/2">
          <div className="whitespace-nowrap rounded bg-[#1e293b] px-2 py-1 text-[10px] text-white shadow-lg">
            API Access Issue (Critical) - 2 days
          </div>
          <div className="mx-auto h-0 w-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[#1e293b]" />
        </div>

        {bars.map((height, i) => (
          <div
            key={i}
            className={`w-full rounded-t-sm transition-all duration-500 ${
              i === 3 ? 'bg-blue-600' : 'bg-blue-100'
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[8px] font-medium text-gray-400">
        <span>Oct 15</span>
        <span>Oct 21</span>
      </div>
    </div>
  );
}
