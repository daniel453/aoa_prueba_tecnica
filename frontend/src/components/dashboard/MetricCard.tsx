import type { ReactNode } from 'react';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate';

const tones: Record<Tone, { iconBg: string; iconColor: string }> = {
  blue: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  green: { iconBg: 'bg-green-50', iconColor: 'text-green-600' },
  amber: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  red: { iconBg: 'bg-red-50', iconColor: 'text-red-600' },
  slate: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
};

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  tone?: Tone;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
  loading = false,
}: MetricCardProps) {
  const t = tones[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.iconBg} ${t.iconColor}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
