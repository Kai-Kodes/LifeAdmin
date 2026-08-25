import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: ReactNode;
  accent?: string;
  loading?: boolean;
}

export default function StatCard({ label, value, icon, accent = 'text-surface-600', loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-surface-50 ${accent}`}>
          {icon}
        </span>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded bg-surface-100" />
        ) : (
          <p className="text-2xl font-bold text-surface-900 tabular-nums">{value ?? 0}</p>
        )}
        <p className="mt-0.5 text-sm text-surface-500">{label}</p>
      </div>
    </div>
  );
}
