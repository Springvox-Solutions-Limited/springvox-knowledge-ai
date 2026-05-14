import { cn } from '@/src/lib/utils';

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const value = status || 'unknown';

  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
        value === 'active' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        value === 'trial' && 'border-cyan-200 bg-cyan-50 text-cyan-700',
        value === 'suspended' && 'border-amber-200 bg-amber-50 text-amber-700',
        value === 'inactive' && 'border-slate-200 bg-slate-100 text-slate-600',
        !['active', 'trial', 'suspended', 'inactive'].includes(value) &&
          'border-slate-200 bg-slate-50 text-slate-600',
      )}
    >
      {value}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string | null | undefined }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">
      {plan || 'unknown'}
    </span>
  );
}
