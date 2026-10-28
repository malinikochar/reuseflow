'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FlaskConical,
  HelpCircle,
  Lock,
  Recycle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  BatterySafety,
  Decision,
  SanitizationStatus,
  WorkflowStatus,
} from '@/types/domain';
import { cn } from '@/lib/utils';

export function DemoModeBanner({
  onReset,
  isResetting,
}: {
  onReset?: () => void;
  isResetting?: boolean;
}) {
  return (
    <div
      role="region"
      aria-label="Sandbox Mode Notice"
      className="no-print bg-amber-950 text-amber-50 border-b border-amber-800 px-4 py-2.5 text-xs sm:text-sm"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 font-semibold text-amber-200 shrink-0">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Fictional Sample Data
          </span>
          <span className="text-amber-100/90">
            Isolated browser sandbox — changes stay in your local browser only, never write to production Supabase, and never send live emails.
          </span>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={isResetting}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-900 hover:bg-amber-800 border border-amber-700 px-3 py-1 text-xs font-medium text-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', isResetting && 'animate-spin')}
              aria-hidden="true"
            />
            Reset Demo Sandbox
          </button>
        )}
      </div>
    </div>
  );
}

export function SafetyBanner({
  batterySafety,
  status,
}: {
  batterySafety: BatterySafety;
  status: WorkflowStatus;
}) {
  if (batterySafety !== 'swollen' && status !== 'quarantined') {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-lg border-2 border-amber-600 bg-amber-50 p-4 text-amber-950 shadow-xs"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert
          className="h-6 w-6 text-amber-700 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="space-y-1 text-sm">
          <p className="font-bold text-amber-950">
            Safety Quarantine Active — Physical Battery Hazard
          </p>
          <p className="text-amber-900 leading-relaxed">
            This device has a <span className="font-semibold">swollen battery</span> or active quarantine hold. Safety gates override all economic scoring. Follow your organization&apos;s authorized lithium-ion containment procedures immediately. Refurbishment approval is locked.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SanitizationBadge({
  storagePresent,
  status,
  compact = false,
}: {
  storagePresent: boolean;
  status: SanitizationStatus;
  compact?: boolean;
}) {
  if (!storagePresent || status === 'not_applicable') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-stone-100 text-stone-700 font-medium',
          compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        )}
      >
        No Storage Media (Gate Open)
      </span>
    );
  }

  if (status === 'verified') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 font-medium',
          compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
        External Sanitization Verified
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 text-amber-900 font-medium',
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0" aria-hidden="true" />
      Sanitization Not Yet Verified
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: Decision | null | undefined }) {
  if (!decision) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
        Unassessed
      </span>
    );
  }

  const config: Record<
    Decision,
    { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    REFURBISH_CANDIDATE: {
      label: 'Refurbish Candidate',
      classes: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      icon: CheckCircle2,
    },
    REVIEW_REQUIRED: {
      label: 'Review Required',
      classes: 'border-sky-300 bg-sky-50 text-sky-900',
      icon: HelpCircle,
    },
    RECYCLE_REVIEW: {
      label: 'Recycle Review',
      classes: 'border-stone-400 bg-stone-100 text-stone-900',
      icon: Recycle,
    },
    QUARANTINE: {
      label: 'Safety Quarantine',
      classes: 'border-amber-500 bg-amber-100 text-amber-950 font-semibold',
      icon: AlertTriangle,
    },
    INSUFFICIENT_DATA: {
      label: 'Insufficient Data',
      classes: 'border-purple-300 bg-purple-50 text-purple-900',
      icon: Clock,
    },
  };

  const item = config[decision];
  const Icon = item.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
        item.classes
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </span>
  );
}

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const labels: Record<WorkflowStatus, { text: string; classes: string }> = {
    intake: {
      text: 'Intake Draft',
      classes: 'bg-stone-100 text-stone-800 border-stone-300',
    },
    assessed: {
      text: 'Assessed · Awaiting Approval',
      classes: 'bg-sky-50 text-sky-900 border-sky-300',
    },
    approved_refurb: {
      text: 'Approved for Refurb',
      classes: 'bg-teal-50 text-teal-900 border-teal-300',
    },
    repairing: {
      text: 'In Bench Repair',
      classes: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    },
    ready: {
      text: 'Ready for Distribution',
      classes: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-semibold',
    },
    recycle_review: {
      text: 'In Recycle Review',
      classes: 'bg-stone-200 text-stone-900 border-stone-400',
    },
    quarantined: {
      text: 'Quarantined (Hazard)',
      classes: 'bg-amber-100 text-amber-950 border-amber-500 font-semibold',
    },
    closed: {
      text: 'Closed / Finalized',
      classes: 'bg-neutral-800 text-neutral-100 border-neutral-700',
    },
  };

  const current = labels[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium',
        current.classes
      )}
    >
      {status === 'repairing' && <Wrench className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {current.text}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  subtext,
  accent = 'default',
}: {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: 'default' | 'emerald' | 'amber' | 'sky';
}) {
  const borderClass =
    accent === 'emerald'
      ? 'border-l-4 border-l-emerald-700'
      : accent === 'amber'
        ? 'border-l-4 border-l-amber-600'
        : accent === 'sky'
          ? 'border-l-4 border-l-sky-700'
          : 'border-l-4 border-l-stone-700';

  return (
    <div
      className={cn(
        'rounded-lg border border-stone-200 bg-white p-4 shadow-2xs',
        borderClass
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-stone-950">{value}</p>
      {subtext && <p className="mt-1 text-xs text-stone-600">{subtext}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-8 text-center">
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to complete operation',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-950"
    >
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-red-900">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center rounded-md bg-red-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading content" className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-lg bg-stone-200/80 border border-stone-200"
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
