'use client';

import React, { useState } from 'react';
import { Eye, Mail, Send, ShieldCheck } from 'lucide-react';
import { Device, UserRole } from '@/types/domain';
import { formatCents } from '@/lib/decision/engine';

export function buildOperationalSummaryText(devices: Device[], isDemo: boolean) {
  const total = devices.length;
  const refurbCount = devices.filter(
    (d) => d.latestAssessment?.decision === 'REFURBISH_CANDIDATE'
  ).length;
  const reviewCount = devices.filter(
    (d) =>
      d.latestAssessment?.decision === 'REVIEW_REQUIRED' ||
      d.latestAssessment?.decision === 'INSUFFICIENT_DATA'
  ).length;
  const recycleCount = devices.filter(
    (d) => d.latestAssessment?.decision === 'RECYCLE_REVIEW'
  ).length;
  const quarantineCount = devices.filter(
    (d) => d.status === 'quarantined' || d.latestAssessment?.decision === 'QUARANTINE'
  ).length;

  const totalMarginCents = devices
    .filter((d) => d.latestAssessment?.decision === 'REFURBISH_CANDIDATE')
    .reduce((acc, d) => acc + (d.latestAssessment?.marginCents ?? 0), 0);

  return {
    subject: isDemo
      ? '[DEMO PREVIEW — NO EMAIL SENT] ReuseFlow — Weekly Sample Operations Summary'
      : 'ReuseFlow — Weekly Sample Operations Summary',
    body: [
      isDemo
        ? 'NOTE: THIS IS A FICTIONAL SANDBOX PREVIEW. NO EMAIL IS SENT FROM /DEMO.'
        : 'ReuseFlow Internal Operations Summary (Aggregate Metrics Only — Zero PII)',
      '------------------------------------------------------------------------',
      `Total Triaged Devices: ${total}`,
      `• Refurbish Candidates (Requires Approval): ${refurbCount}`,
      `• Needs Technician / Manager Review: ${reviewCount}`,
      `• Recycle Review Candidates: ${recycleCount}`,
      `• Active Safety Quarantine Holds: ${quarantineCount}`,
      `• Estimated Net Margin on Refurbish Candidates: ${formatCents(totalMarginCents)}`,
      '',
      'Safety & Privacy Compliance Notice:',
      '- No donor names, recipient identities, or device serial numbers are included.',
      '- ReuseFlow does not perform automated data wiping; verify sanitization on bench.',
    ].join('\n'),
  };
}

export function EmailSummaryPanel({
  devices,
  isDemo,
  actorRole,
}: {
  devices: Device[];
  isDemo: boolean;
  actorRole: UserRole;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [recipient, setRecipient] = useState('ops-manager@example.org');
  const [statusMsg, setStatusMsg] = useState<{
    type: 'info' | 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const summary = buildOperationalSummaryText(devices, isDemo);

  const handleTriggerSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setShowPreview(true);
      setStatusMsg({
        type: 'info',
        text: 'Public /demo sandbox never sends live emails. Showing deterministic summary preview below.',
      });
      return;
    }

    if (actorRole !== 'manager') {
      setStatusMsg({
        type: 'error',
        text: 'Only an authenticated Refurbishment Manager can send operational summary emails.',
      });
      return;
    }

    setIsSending(true);
    setStatusMsg(null);
    try {
      const response = await fetch('/api/reports/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          scope: 'all',
          idempotencyKey: `summary-${new Date().toISOString().slice(0, 13)}-${devices.length}`,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        code?: string;
      };

      if (data.ok) {
        setStatusMsg({
          type: 'success',
          text: data.message ?? 'Operational summary sent via Resend.',
        });
      } else {
        setStatusMsg({
          type: data.code === 'FAILED_DEPENDENCY' ? 'info' : 'error',
          text:
            data.message ??
            'Email notifications not configured or recipient not in allowlist.',
        });
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Could not reach server email endpoint.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section
      aria-label="Operational Summary Email Notification"
      className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden"
    >
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-teal-800" aria-hidden="true" />
          <h3 className="text-sm font-bold text-stone-950">
            Manager Operational Summary Email (Optional P1 · Resend)
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-800" aria-hidden="true" />
          {isDemo ? 'Isolated Demo Preview — No Email is Sent' : 'Server-Only Allowlisted Send'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-xs text-stone-600">
          {isDemo
            ? 'In the public /demo sandbox, external email delivery is strictly disabled. Click below to inspect the exact aggregate summary payload that an authenticated manager can send via Resend.'
            : 'Managers can manually trigger an aggregate operations summary to an allowlisted address via Resend. Contains zero PII or serial numbers.'}
        </p>

        {statusMsg && (
          <div
            role="status"
            className={`rounded-lg border p-3 text-xs font-medium ${
              statusMsg.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : statusMsg.type === 'info'
                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                  : 'border-red-300 bg-red-50 text-red-950'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleTriggerSend} className="flex flex-wrap items-end gap-3">
          {!isDemo && (
            <div className="flex-1 min-w-[240px]">
              <label
                htmlFor="summary-recipient-email"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Approved Recipient Email (Checked against server allowlist)
              </label>
              <input
                id="summary-recipient-email"
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {showPreview ? 'Hide Summary Preview' : 'Preview Summary Content'}
          </button>

          {!isDemo && (
            <button
              type="submit"
              disabled={isSending || actorRole !== 'manager'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              {isSending ? 'Sending...' : 'Send Summary via Resend'}
            </button>
          )}
        </form>

        {showPreview && (
          <div className="rounded-lg border border-stone-300 bg-stone-900 text-stone-100 p-4 font-mono text-xs space-y-2 overflow-x-auto">
            <div className="flex items-center justify-between border-b border-stone-700 pb-2 text-amber-300">
              <span>Subject: {summary.subject}</span>
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase">
                No Email Is Sent in Demo
              </span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-stone-200">
              {summary.body}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
