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

  // Sync default selectedNext when device changes
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
      className="no-print rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden"
    >
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-teal-800" aria-hidden="true" />
          <h3 className="text-base font-bold text-stone-950">
            Human Workflow Review & Gate Controls
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">Current State:</span>
          <WorkflowStatusBadge status={device.status} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {feedback && (
          <div
            role="alert"
            className={`rounded-lg border p-3 text-xs font-medium ${
              feedback.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-red-300 bg-red-50 text-red-950'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Data Sanitization Gate Section */}
        <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <HardDrive
                className="h-4 w-4 text-stone-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  External Data Sanitization Gate
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  ReuseFlow <strong>never performs device wiping</strong>. Staff must record verification of an external sanitization procedure before a storage-bearing device can reach <code className="font-mono">ready</code> or <code className="font-mono">closed</code>.
                </p>
              </div>
            </div>

            {actorRole === 'manager' && device.storagePresent && (
              <button
                type="button"
                onClick={() => setShowSanitizeForm((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-800 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-teal-800" aria-hidden="true" />
                {showSanitizeForm
                  ? 'Cancel'
                  : device.sanitizationStatus === 'verified'
                    ? 'Update Sanitization Log'
                    : 'Record External Sanitization'}
              </button>
            )}
          </div>

          {device.sanitizationNote && (
            <div className="rounded bg-white border border-stone-200 px-3 py-2 text-xs text-stone-700">
              <span className="font-semibold">Recorded Note:</span> {device.sanitizationNote}{' '}
              {device.sanitizationVerifiedBy && (
                <span className="text-stone-500">
                  ({device.sanitizationVerifiedBy} ·{' '}
                  {formatDateTime(device.sanitizationVerifiedAt)})
                </span>
              )}
            </div>
          )}

          {showSanitizeForm && (
            <form
              onSubmit={handleSanitizationSubmit}
              className="rounded-lg border border-teal-200 bg-white p-3.5 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="sanitize-status-select"
                    className="block text-xs font-semibold text-stone-800 mb-1"
                  >
                    External Sanitization Status
                  </label>
                  <select
                    id="sanitize-status-select"
                    value={sanitizeStatus}
                    onChange={(e) =>
                      setSanitizeStatus(e.target.value as SanitizationStatus)
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900"
                  >
                    <option value="verified">Verified (External Wipe Completed)</option>
                    <option value="pending">Pending (Not Yet Verified)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="sanitize-note-input"
                    className="block text-xs font-semibold text-stone-800 mb-1"
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
                    className="w-full rounded-md border border-stone-300 px-2.5 py-1.5 text-xs text-stone-900"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="rounded-md bg-teal-800 hover:bg-teal-900 px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Save External Sanitization Assertion
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Workflow Transition Form */}
        {device.status === 'closed' ? (
          <div className="rounded-lg border border-stone-200 bg-stone-100 p-4 text-xs text-stone-700">
            This device record is <strong>closed</strong> (Disposition:{' '}
            <span className="font-semibold uppercase">{device.disposition ?? 'recorded'}</span>)
            and is terminal in the MVP workflow.
          </div>
        ) : (
          <form onSubmit={handleTransitionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="workflow-next-status"
                  className="block text-xs font-semibold text-stone-800 mb-1"
                >
                  Select Authorized Next Workflow Action
                </label>
                <select
                  id="workflow-next-status"
                  value={selectedNext}
                  onChange={(e) => setSelectedNext(e.target.value as WorkflowStatus)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
                    className="block text-xs font-semibold text-stone-800 mb-1"
                  >
                    Final Disposition Category *
                  </label>
                  <select
                    id="workflow-disposition"
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value as Disposition)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
                className="block text-xs font-semibold text-stone-800 mb-1"
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
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            {/* Guardrail notices */}
            {selectedNext &&
              isManagerRequiredForTransition(device.status, selectedNext) &&
              actorRole !== 'manager' && (
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  <Lock className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>
                    Current active role is <strong className="uppercase">{actorRole}</strong>.
                    Final approval into <code className="font-mono">{selectedNext}</code> requires{' '}
                    <strong>Manager</strong> authorization (try clicking anyway to test server/guard rejection, or switch role in the top bar).
                  </span>
                </div>
              )}

            {device.storagePresent &&
              device.sanitizationStatus !== 'verified' &&
              (selectedNext === 'ready' || selectedNext === 'closed') && (
                <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  <ShieldAlert
                    className="h-4 w-4 text-amber-700 shrink-0"
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
                className="inline-flex items-center gap-2 rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50 cursor-pointer"
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
      className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden"
    >
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-3.5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-950">
          Append-Only Workflow Audit Timeline ({events.length})
        </h3>
        <span className="text-xs text-stone-500">Newest first · Immutable log</span>
      </div>

      <div className="p-5">
        <ol className="relative border-l-2 border-stone-200 ml-2 space-y-4">
          {ordered.map((ev) => (
            <li key={ev.id} className="ml-5">
              <span
                className="absolute -left-2 mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-teal-800"
                aria-hidden="true"
              />
              <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5 font-semibold text-stone-900">
                    {ev.fromStatus ? (
                      <>
                        <span className="font-mono text-stone-600">{ev.fromStatus}</span>
                        <ArrowRight className="h-3 w-3 text-stone-400" aria-hidden="true" />
                        <span className="font-mono text-teal-900">{ev.toStatus}</span>
                      </>
                    ) : (
                      <span className="font-mono text-teal-900">
                        Created ({ev.toStatus})
                      </span>
                    )}
                    <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-stone-700">
                      {ev.actorRole}
                    </span>
                  </div>
                  <time className="text-stone-500" dateTime={ev.createdAt}>
                    {formatDateTime(ev.createdAt)} · {ev.actorName}
                  </time>
                </div>
                <p className="mt-1.5 text-xs text-stone-700 leading-relaxed">{ev.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
