import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ChevronLeft } from './Icons';

export function PageHeader({
  title,
  subtitle,
  back,
  right,
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  right?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="mb-6 animate-fadein">
      {back && (
        <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400">
          <ChevronLeft width={16} height={16} /> Späť
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="label mb-1">{eyebrow}</div>}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function ProgressBar({ value, className, color = 'indigo' }: { value: number; className?: string; color?: 'indigo' | 'emerald' | 'amber' | 'rose' }) {
  const colors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', colors[color])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function accColor(acc: number | null): 'indigo' | 'emerald' | 'amber' | 'rose' {
  if (acc === null) return 'indigo';
  if (acc >= 85) return 'emerald';
  if (acc >= 60) return 'amber';
  return 'rose';
}

export function accText(acc: number | null) {
  if (acc === null) return 'text-slate-400';
  if (acc >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (acc >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export function Ring({ value, size = 64, stroke = 7, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-slate-200 dark:stroke-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)}
          className="fill-none stroke-indigo-500 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-bold">{children}</div>
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" className="inline-flex min-w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900 sm:min-w-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={value === t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition sm:flex-none',
              value === t.id
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Dots({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${value} z ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cn('h-2 w-4 rounded-full', i < value ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700')} />
      ))}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">{children}</div>;
}
