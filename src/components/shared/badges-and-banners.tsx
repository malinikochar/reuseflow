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
      className="no-print bg-[#FFFFFF] text-[#0A0A0A] border-b border-[#E8E8EC] px-6 py-2.5 text-[13px]"
    >
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 px-3 py-1 text-[12px] font-medium text-[#B45309] shrink-0">
            <FlaskConical className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
            Fictional Sample Data
          </span>
          <span className="text-[#6B6B6B]">
            Isolated browser sandbox — changes stay in your local browser only, never write to production Supabase, and never send live emails.
          </span>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={isResetting}
            className="genesis-btn-secondary inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] disabled:opacity-50 self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5 text-[#6B6B6B]', isResetting && 'animate-spin')}
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
      className="rounded-[8px] border border-[#F59E0B] bg-[#F59E0B]/10 p-4 text-[#0A0A0A]"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert
          className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="space-y-1 text-[13px]">
          <p className="font-display font-bold text-[#0A0A0A]">
            Safety Quarantine Active — Physical Battery Hazard
          </p>
          <p className="text-[#6B6B6B] leading-relaxed">
            This device has a <span className="font-medium text-[#0A0A0A]">swollen battery</span> or active quarantine hold. Safety gates override all economic scoring. Follow your organization&apos;s authorized lithium-ion containment procedures immediately. Refurbishment approval is locked.
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
          'inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F6] text-[#6B6B6B] font-medium',
          compact ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]'
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
          'inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/12 text-[#065F46] font-medium',
          compact ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]'
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-[#10B981] shrink-0" aria-hidden="true" />
        External Sanitization Verified
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B]/15 text-[#92400E] font-medium',
        compact ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]'
      )}
    >
      <Lock className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" aria-hidden="true" />
      Sanitization Not Yet Verified
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: Decision | null | undefined }) {
  if (!decision) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F6] px-3 py-1 text-[12px] font-medium text-[#6B6B6B]">
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
      classes: 'bg-[#10B981]/12 text-[#065F46]',
      icon: CheckCircle2,
    },
    REVIEW_REQUIRED: {
      label: 'Review Required',
      classes: 'bg-[#F59E0B]/15 text-[#92400E]',
      icon: HelpCircle,
    },
    RECYCLE_REVIEW: {
      label: 'Recycle Review',
      classes: 'bg-[#EF4444]/12 text-[#991B1B]',
      icon: Recycle,
    },
    QUARANTINE: {
      label: 'Safety Quarantine',
      classes: 'bg-[#F59E0B]/20 text-[#92400E] border border-[#F59E0B]/50',
      icon: AlertTriangle,
    },
    INSUFFICIENT_DATA: {
      label: 'Insufficient Data',
      classes: 'bg-[#F4F4F6] text-[#6B6B6B]',
      icon: Clock,
    },
  };

  const item = config[decision];
  const Icon = item.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium',
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
      classes: 'bg-[#F4F4F6] text-[#6B6B6B]',
    },
    assessed: {
      text: 'Assessed · Awaiting Approval',
      classes: 'bg-[#F59E0B]/15 text-[#92400E]',
    },
    approved_refurb: {
      text: 'Approved for Refurb',
      classes: 'bg-[#10B981]/12 text-[#065F46]',
    },
    repairing: {
      text: 'In Bench Repair',
      classes: 'bg-[#6366F1]/12 text-[#4F46E5]',
    },
    ready: {
      text: 'Ready for Distribution',
      classes: 'bg-[#10B981]/20 text-[#065F46]',
    },
    recycle_review: {
      text: 'In Recycle Review',
      classes: 'bg-[#EF4444]/12 text-[#991B1B]',
    },
    quarantined: {
      text: 'Quarantined (Hazard)',
      classes: 'bg-[#F59E0B]/20 text-[#92400E]',
    },
    closed: {
      text: 'Closed / Finalized',
      classes: 'bg-[#0A0A0A] text-[#FAFAFA]',
    },
  };

  const current = labels[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium',
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
  const dotColor =
    accent === 'emerald'
      ? 'bg-[#10B981]'
      : accent === 'amber'
        ? 'bg-[#F59E0B]'
        : accent === 'sky'
          ? 'bg-[#6366F1]'
          : 'bg-[#9C9C9C]';

  return (
    <div className="genesis-card genesis-card-interactive p-5">
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 rounded-full', dotColor)} aria-hidden="true" />
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
          {label}
        </p>
      </div>
      <p className="mt-2 font-display text-[32px] font-bold leading-none tracking-[-0.03em] text-[#0A0A0A]">
        {value}
      </p>
      {subtext && <p className="mt-2 text-[12px] text-[#6B6B6B]">{subtext}</p>}
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
    <div className="genesis-card p-10 text-center">
      <h3 className="font-display text-[18px] font-bold text-[#0A0A0A]">{title}</h3>
      <p className="mt-1.5 text-[14px] text-[#6B6B6B] max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
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
      className="rounded-[8px] border border-[#EF4444] bg-[#EF4444]/8 p-4 text-[#0A0A0A]"
    >
      <div className="flex items-start gap-3">
        <XCircle className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 text-[13px]">
          <p className="font-medium text-[#0A0A0A]">{title}</p>
          <p className="mt-1 text-[#6B6B6B]">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="genesis-btn-secondary mt-3 inline-flex items-center px-3 py-1.5 text-[12px] cursor-pointer"
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
          className="h-14 rounded-[12px] bg-[#FFFFFF] border border-[#E8E8EC]"
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
