'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HardDrive,
  Lock,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import {
  Device,
  Disposition,
  SanitizationStatus,
  UserRole,
  WorkflowEvent,
  WorkflowStatus,
} from '@/types/domain';
import {
  ALLOWED_WORKFLOW_TRANSITIONS,
  isManagerRequiredForTransition,
} from '@/lib/decision/workflow-guards';
import { WorkflowStatusBadge } from '@/components/shared/badges-and-banners';
import { formatDateTime } from '@/lib/utils';

const STATUS_ACTION_LABELS: Record<WorkflowStatus, string> = {
  intake: 'Return to Intake Draft',
  assessed: 'Return to Assessed / Request Details',
  approved_refurb: 'Approve for Refurbishment',
  repairing: 'Start Bench Repair',
  ready: 'Mark Ready for Distribution',
  recycle_review: 'Route to Recycle Review',
  quarantined: 'Place in Safety Quarantine',
  closed: 'Close & Record Final Disposition',
};

export function WorkflowDecisionControls({
  device,
  actorRole,
  onTransition,
  onVerifySanitization,
  isBusy = false,
}: {
  device: Device;
  actorRole: UserRole;
  onTransition: (params: {
    nextStatus: WorkflowStatus;
    note: string;
    disposition?: Disposition | null;
  }) => Promise<{ ok: boolean; message?: string }>;
  onVerifySanitization: (params: {
    status: SanitizationStatus;
    note: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  isBusy?: boolean;
}) {
  const allowedNext = ALLOWED_WORKFLOW_TRANSITIONS[device.status] ?? [];
  const [selectedNext, setSelectedNext] = useState<WorkflowStatus | ''>(
    allowedNext[0] ?? ''
  );
  const [transitionNote, setTransitionNote] = useState(
    'Reviewed reason codes and cost breakdown; approved next operational step.'
  );
  const [disposition, setDisposition] = useState<Disposition>('distributed');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showSanitizeForm, setShowSanitizeForm] = useState(false);
  const [sanitizeStatus, setSanitizeStatus] = useState<SanitizationStatus>('verified');
  const [sanitizeNote, setSanitizeNote] = useState(
    'External NIST 800-88 clear verified on sanitization bench (Reference ID: SAN-BENCH-04).'
  );

  React.useEffect(() => {
    const nextList = ALLOWED_WORKFLOW_TRANSITIONS[device.status] ?? [];
    setSelectedNext(nextList[0] ?? '');
    setFeedback(null);
  }, [device.id, device.status]);

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNext) return;
    setFeedback(null);

    const res = await onTransition({
      nextStatus: selectedNext,
      note: transitionNote,
      disposition: selectedNext === 'closed' ? disposition : null,
    });

    if (res.ok) {
      setFeedback({
        type: 'success',
        text: `Workflow transitioned to '${selectedNext}'. Audit event appended.`,
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.message ?? 'Transition rejected by workflow guardrails.',
      });
    }
  };

  const handleSanitizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = await onVerifySanitization({
      status: sanitizeStatus,
      note: sanitizeNote,
    });

    if (res.ok) {
      setShowSanitizeForm(false);
      setFeedback({
        type: 'success',
        text: `External sanitization status updated to '${sanitizeStatus}'.`,
      });
    } else {
      setFeedback({
        type: 'error',
        text: res.message ?? 'Could not update sanitization status.',
      });
    }
  };

  return (
    <section
      aria-label="Human Workflow Approval & Sanitization Controls"
      className="no-print genesis-card overflow-hidden"
    >
      <div className="border-b border-[#E8E8EC] bg-[#FFFFFF] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
          <h3 className="font-display text-[18px] font-bold text-[#0A0A0A]">
            Human Workflow Review & Gate Controls
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[#9C9C9C]">Current State:</span>
          <WorkflowStatusBadge status={device.status} />
        </div>
      </div>

      <div className="p-6 space-y-5">
        {feedback && (
          <div
            role="alert"
            className={`rounded-[6px] border p-3 text-[12px] font-medium ${
              feedback.type === 'success'
                ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#065F46]'
                : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#991B1B]'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Data Sanitization Gate Section */}
        <div className="genesis-panel bg-[#FAFAFA] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <HardDrive
                className="h-4 w-4 text-[#6B6B6B] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                  External Data Sanitization Gate
                </h4>
                <p className="text-[12px] text-[#6B6B6B] mt-1">
                  ReuseFlow <span className="font-medium text-[#0A0A0A]">never performs device wiping</span>. Staff must record verification of an external sanitization procedure before a storage-bearing device can reach <code className="font-mono text-[#0A0A0A]">ready</code> or <code className="font-mono text-[#0A0A0A]">closed</code>.
                </p>
              </div>
            </div>

            {actorRole === 'manager' && device.storagePresent && (
              <button
                type="button"
                onClick={() => setShowSanitizeForm((prev) => !prev)}
                className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                {showSanitizeForm
                  ? 'Cancel'
                  : device.sanitizationStatus === 'verified'
                    ? 'Update Sanitization Log'
                    : 'Record External Sanitization'}
              </button>
            )}
          </div>

          {device.sanitizationNote && (
            <div className="genesis-panel px-3 py-2 text-[12px] text-[#6B6B6B]">
              <span className="font-medium text-[#0A0A0A]">Recorded Note:</span>{' '}
              {device.sanitizationNote}{' '}
              {device.sanitizationVerifiedBy && (
                <span className="text-[#9C9C9C]">
                  ({device.sanitizationVerifiedBy} ·{' '}
                  {formatDateTime(device.sanitizationVerifiedAt)})
                </span>
              )}
            </div>
          )}

          {showSanitizeForm && (
            <form
              onSubmit={handleSanitizationSubmit}
              className="genesis-panel p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="sanitize-status-select"
                    className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
                  >
                    External Sanitization Status
                  </label>
                  <select
                    id="sanitize-status-select"
                    value={sanitizeStatus}
                    onChange={(e) =>
                      setSanitizeStatus(e.target.value as SanitizationStatus)
                    }
                    className="genesis-input w-full"
                  >
                    <option value="verified">Verified (External Wipe Completed)</option>
                    <option value="pending">Pending (Not Yet Verified)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="sanitize-note-input"
                    className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
                  >
                    External Procedure & Bench Reference Note (Not a Wipe Certificate) *
                  </label>
                  <input
                    id="sanitize-note-input"
                    type="text"
                    required
                    minLength={5}
                    value={sanitizeNote}
                    onChange={(e) => setSanitizeNote(e.target.value)}
                    className="genesis-input w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="genesis-btn-secondary px-3.5 py-1.5 text-[12px] cursor-pointer"
                >
                  Save External Sanitization Assertion
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Workflow Transition Form */}
        {device.status === 'closed' ? (
          <div className="genesis-panel bg-[#FAFAFA] p-4 text-[12px] text-[#6B6B6B]">
            This device record is <span className="font-medium text-[#0A0A0A]">closed</span> (Disposition:{' '}
            <span className="font-mono uppercase text-[#0A0A0A]">{device.disposition ?? 'recorded'}</span>)
            and is terminal in the MVP workflow.
          </div>
        ) : (
          <form onSubmit={handleTransitionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="workflow-next-status"
                  className="block text-[12px] font-medium text-[#0A0A0A] mb-1.5"
                >
                  Select Authorized Next Workflow Action
                </label>
                <select
                  id="workflow-next-status"
                  value={selectedNext}
                  onChange={(e) => setSelectedNext(e.target.value as WorkflowStatus)}
                  className="genesis-input w-full"
                >
                  {allowedNext.map((nextState) => {
                    const needsMgr = isManagerRequiredForTransition(
                      device.status,
                      nextState
                    );
                    return (
                      <option key={nextState} value={nextState}>
                        {STATUS_ACTION_LABELS[nextState]} ({nextState})
                        {needsMgr ? ' [Manager Only]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedNext === 'closed' && (
                <div>
                  <label
                    htmlFor="workflow-disposition"
                    className="block text-[12px] font-medium text-[#0A0A0A] mb-1.5"
                  >
                    Final Disposition Category *
                  </label>
                  <select
                    id="workflow-disposition"
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value as Disposition)}
                    className="genesis-input w-full"
                  >
                    <option value="distributed">Distributed to Community Program</option>
                    <option value="recycled">Transferred to Authorized Recycler</option>
                    <option value="other_authorized">Other Authorized Disposition</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="workflow-audit-note"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1.5"
              >
                Immutable Workflow Audit Note *
              </label>
              <input
                id="workflow-audit-note"
                type="text"
                required
                minLength={3}
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="Explain rationale for approval, escalation, or status change..."
                className="genesis-input w-full"
              />
            </div>

            {selectedNext &&
              isManagerRequiredForTransition(device.status, selectedNext) &&
              actorRole !== 'manager' && (
                <div className="flex items-center gap-2 rounded-[6px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-2 text-[12px] text-[#92400E]">
                  <Lock className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
                  <span>
                    Current active role is <strong className="uppercase">{actorRole}</strong>.
                    Final approval into <code className="font-mono">{selectedNext}</code> requires{' '}
                    <strong>Manager</strong> authorization (switch role in the top bar or click to test guard rejection).
                  </span>
                </div>
              )}

            {device.storagePresent &&
              device.sanitizationStatus !== 'verified' &&
              (selectedNext === 'ready' || selectedNext === 'closed') && (
                <div className="flex items-center gap-2 rounded-[6px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-2 text-[12px] text-[#92400E]">
                  <ShieldAlert
                    className="h-4 w-4 text-[#F59E0B] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Sanitization Gate Locked:</strong> Storage media is present and
                    sanitization is still pending. Verify external sanitization above before marking{' '}
                    <code className="font-mono">{selectedNext}</code>.
                  </span>
                </div>
              )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isBusy || !selectedNext}
                className="genesis-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-[13px] disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {selectedNext ? STATUS_ACTION_LABELS[selectedNext] : 'Apply Transition'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export function WorkflowTimeline({ events }: { events: WorkflowEvent[] }) {
  const ordered = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <section
      aria-label="Immutable Workflow Audit Trail"
      className="genesis-card overflow-hidden"
    >
      <div className="border-b border-[#E8E8EC] bg-[#FFFFFF] px-6 py-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-bold text-[#0A0A0A]">
          Append-Only Workflow Audit Timeline ({events.length})
        </h3>
        <span className="text-[12px] text-[#9C9C9C]">Newest first · Immutable log</span>
      </div>

      <div className="divide-y divide-[#E8E8EC]">
        {ordered.map((ev) => (
          <div
            key={ev.id}
            className="px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors space-y-1.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="flex flex-wrap items-center gap-1.5 font-medium text-[#0A0A0A]">
                {ev.fromStatus ? (
                  <>
                    <span className="font-mono text-[#6B6B6B]">{ev.fromStatus}</span>
                    <ArrowRight className="h-3 w-3 text-[#9C9C9C]" aria-hidden="true" />
                    <span className="font-mono text-[#6366F1]">{ev.toStatus}</span>
                  </>
                ) : (
                  <span className="font-mono text-[#6366F1]">
                    Created ({ev.toStatus})
                  </span>
                )}
                <span className="rounded-full bg-[#F4F4F6] px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                  {ev.actorRole}
                </span>
              </div>
              <time className="text-[#9C9C9C]" dateTime={ev.createdAt}>
                {formatDateTime(ev.createdAt)} · {ev.actorName}
              </time>
            </div>
            <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{ev.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
