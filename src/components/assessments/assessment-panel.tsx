'use client';

import React, { useState } from 'react';
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  Play,
  Printer,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import {
  AssessmentRecord,
  Device,
  EngineConfig,
  UserRole,
} from '@/types/domain';
import {
  DEFAULT_ENGINE_CONFIG,
  evaluateDevice,
  formatCents,
} from '@/lib/decision/engine';
import {
  DecisionBadge,
  SafetyBanner,
  SanitizationBadge,
} from '@/components/shared/badges-and-banners';
import { formatDateTime } from '@/lib/utils';

export function DecisionReasons({
  reasonCodes,
  reasonDetails,
  missingFields,
}: {
  reasonCodes: string[];
  reasonDetails: string[];
  missingFields: string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {reasonCodes.map((code) => (
          <span
            key={code}
            className="inline-flex items-center rounded bg-stone-100 border border-stone-300 px-2 py-0.5 font-mono text-[11px] font-medium text-stone-800"
          >
            {code}
          </span>
        ))}
      </div>
      <ul className="space-y-1.5 text-sm text-stone-800 list-disc pl-5">
        {reasonDetails.map((detail, idx) => (
          <li key={idx} className="leading-relaxed">
            {detail}
          </li>
        ))}
      </ul>
      {missingFields.length > 0 && (
        <div className="rounded-md border border-purple-200 bg-purple-50 p-3 text-xs text-purple-950">
          <span className="font-semibold">Missing required fields for economic scoring: </span>
          <span className="font-mono">{missingFields.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

export function CostBreakdownCard({
  partsCostCents,
  laborCostCents,
  overheadCents,
  totalRepairCostCents,
  comparableValueCents,
  marginCents,
  hourlyRateCents,
  estimatedLaborMinutes,
  minMarginCents,
}: {
  partsCostCents: number;
  laborCostCents: number;
  overheadCents: number;
  totalRepairCostCents: number;
  comparableValueCents: number;
  marginCents: number;
  hourlyRateCents: number;
  estimatedLaborMinutes: number;
  minMarginCents: number;
}) {
  const isPositiveMargin = marginCents >= minMarginCents;
  const isNegativeMargin = marginCents < 0;

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-4">
      <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-teal-800" aria-hidden="true" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Repair Economics Breakdown (Integer Cents)
          </h4>
        </div>
        <span className="text-xs text-stone-500">
          Illustrative threshold: {formatCents(minMarginCents)} min margin
        </span>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded bg-white p-2.5 border border-stone-200">
          <dt className="text-xs text-stone-500">Parts Assumption</dt>
          <dd className="mt-0.5 font-semibold text-stone-900">
            {formatCents(partsCostCents)}
          </dd>
        </div>
        <div className="rounded bg-white p-2.5 border border-stone-200">
          <dt className="text-xs text-stone-500">
            Labor ({estimatedLaborMinutes}m @ {formatCents(hourlyRateCents)}/hr)
          </dt>
          <dd className="mt-0.5 font-semibold text-stone-900">
            {formatCents(laborCostCents)}
          </dd>
        </div>
        <div className="rounded bg-white p-2.5 border border-stone-200">
          <dt className="text-xs text-stone-500">Overhead Assumption</dt>
          <dd className="mt-0.5 font-semibold text-stone-900">
            {formatCents(overheadCents)}
          </dd>
        </div>
        <div className="rounded bg-white p-2.5 border border-stone-200">
          <dt className="text-xs text-stone-500">Total Estimated Repair Cost</dt>
          <dd className="mt-0.5 font-bold text-stone-900">
            {formatCents(totalRepairCostCents)}
          </dd>
        </div>
        <div className="rounded bg-white p-2.5 border border-stone-200">
          <dt className="text-xs text-stone-500">Manual Comparable Value</dt>
          <dd className="mt-0.5 font-bold text-stone-900">
            {formatCents(comparableValueCents)}
          </dd>
        </div>
        <div
          className={`rounded p-2.5 border ${
            isNegativeMargin
              ? 'bg-red-50 border-red-200 text-red-950'
              : isPositiveMargin
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <dt className="text-xs font-medium opacity-80">Estimated Net Margin</dt>
          <dd className="mt-0.5 font-bold text-base">{formatCents(marginCents)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function AssessmentPanel({
  device,
  engineConfig = DEFAULT_ENGINE_CONFIG,
  actorRole,
  onRunAssessment,
  isAssessing = false,
}: {
  device: Device;
  engineConfig?: EngineConfig;
  actorRole: UserRole;
  onRunAssessment?: () => void;
  isAssessing?: boolean;
}) {
  const [expandedWhy, setExpandedWhy] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [whatIfPartsDollars, setWhatIfPartsDollars] = useState<string>(
    device.partsCostCents !== null ? (device.partsCostCents / 100).toFixed(2) : '20.00'
  );
  const [showWhatIf, setShowWhatIf] = useState(false);

  const latest: AssessmentRecord | null = device.latestAssessment;

  // Compute ephemeral "What if?" simulation without mutating stored assessment history
  const parsedWhatIfCents = Math.max(
    0,
    Math.round((Number.parseFloat(whatIfPartsDollars) || 0) * 100)
  );
  const whatIfResult = showWhatIf
    ? evaluateDevice(
        {
          category: device.category,
          brand: device.brand,
          model: device.model,
          ramGb: device.ramGb,
          storageGb: device.storageGb,
          boots: device.boots,
          condition: device.condition,
          batterySafety: device.batterySafety,
          storagePresent: device.storagePresent,
          repairable: device.repairable,
          chargerIncluded: device.chargerIncluded,
          partsCostCents: parsedWhatIfCents,
          estimatedLaborMinutes: device.estimatedLaborMinutes,
          comparableValueCents: device.comparableValueCents,
        },
        engineConfig,
        device.sanitizationStatus
      )
    : null;

  return (
    <section
      aria-label="Deterministic Assessment & Explainability"
      className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden"
    >
      {/* Header Bar */}
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-stone-950">
              Recommended Action & Explainability
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-950/10 border border-teal-800/30 px-2.5 py-0.5 text-xs font-semibold text-teal-950">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-800" aria-hidden="true" />
              Needs human approval
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-600">
            Deterministic Rule Engine{' '}
            <span className="font-mono font-semibold">
              v{latest?.ruleVersion ?? engineConfig.ruleVersion}
            </span>{' '}
            · Thresholds are configurable hypotheses, not industry standards.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          {actorRole !== 'viewer' && onRunAssessment && (
            <button
              type="button"
              onClick={onRunAssessment}
              disabled={isAssessing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              {isAssessing ? 'Evaluating...' : 'Re-run Assessment'}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 transition-colors cursor-pointer"
            title="Print non-PII bench assessment sheet"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print Sheet
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Independent Safety Banner */}
        <SafetyBanner batterySafety={device.batterySafety} status={device.status} />

        {/* Summary Row: Decision + Independent Gates */}
        {latest ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border border-stone-200 bg-stone-50/50 p-4">
            <div>
              <span className="block text-xs font-medium text-stone-500">
                Engine Recommendation
              </span>
              <div className="mt-1.5 flex items-center gap-2">
                <DecisionBadge decision={latest.decision} />
              </div>
              <span className="mt-1.5 block text-[11px] text-stone-500">
                Evaluated {formatDateTime(latest.createdAt)} by {latest.assessedByName}
              </span>
            </div>

            <div>
              <span className="block text-xs font-medium text-stone-500">
                Physical Safety Gate
              </span>
              <div className="mt-1.5">
                {device.batterySafety === 'swollen' ? (
                  <span className="inline-flex items-center rounded-md border border-amber-500 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">
                    Locked — Swollen Battery Quarantine
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900">
                    Open — Battery {device.batterySafety.replace('_', ' ')}
                  </span>
                )}
              </div>
              <span className="mt-1.5 block text-[11px] text-stone-500">
                Evaluated before any cost calculation
              </span>
            </div>

            <div>
              <span className="block text-xs font-medium text-stone-500">
                Ready / Disposition Sanitization Gate
              </span>
              <div className="mt-1.5">
                <SanitizationBadge
                  storagePresent={device.storagePresent}
                  status={device.sanitizationStatus}
                />
              </div>
              <span className="mt-1.5 block text-[11px] text-stone-500">
                {latest.sanitizationGateOpen
                  ? 'Clear for ready/closed transition when repair finishes'
                  : 'Blocks ready/closed until external wipe is verified'}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
            No assessment snapshot recorded yet. Click <strong>Re-run Assessment</strong> to evaluate this device.
          </div>
        )}

        {/* Expandable "Why this result?" section */}
        {latest && (
          <div className="rounded-lg border border-stone-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedWhy((prev) => !prev)}
              aria-expanded={expandedWhy}
              className="w-full flex items-center justify-between bg-stone-100/80 hover:bg-stone-100 px-4 py-3 text-left text-sm font-semibold text-stone-900 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-teal-800" aria-hidden="true" />
                Why this result? ({latest.reasonCodes.length} triggered rule{' '}
                {latest.reasonCodes.length === 1 ? 'code' : 'codes'})
              </span>
              {expandedWhy ? (
                <ChevronUp className="h-4 w-4 text-stone-600" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-600" aria-hidden="true" />
              )}
            </button>

            {expandedWhy && (
              <div className="p-4 space-y-4 bg-white">
                <DecisionReasons
                  reasonCodes={latest.reasonCodes}
                  reasonDetails={latest.reasonDetails}
                  missingFields={latest.missingFields}
                />

                {latest.costBreakdown ? (
                  <CostBreakdownCard
                    {...latest.costBreakdown}
                    minMarginCents={latest.configSnapshot.minMarginCents}
                  />
                ) : (
                  <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
                    Cost breakdown not computed because{' '}
                    {latest.decision === 'QUARANTINE'
                      ? 'safety quarantine takes priority before economic scoring.'
                      : 'required cost or condition inputs are incomplete.'}
                  </div>
                )}

                {/* Inputs Snapshot */}
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Snapshot Inputs Used (Immutable Assessment #{latest.id.slice(-6)})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-700">
                    <div className="rounded bg-stone-50 px-2.5 py-1.5 border border-stone-200/70">
                      <span className="text-stone-500">Category:</span>{' '}
                      <strong className="capitalize">{latest.inputSnapshot.category}</strong>
                    </div>
                    <div className="rounded bg-stone-50 px-2.5 py-1.5 border border-stone-200/70">
                      <span className="text-stone-500">RAM / Storage:</span>{' '}
                      <strong>
                        {latest.inputSnapshot.ramGb ?? '—'} GB /{' '}
                        {latest.inputSnapshot.storageGb ?? '—'} GB
                      </strong>
                    </div>
                    <div className="rounded bg-stone-50 px-2.5 py-1.5 border border-stone-200/70">
                      <span className="text-stone-500">Boots / Repairable:</span>{' '}
                      <strong>
                        {latest.inputSnapshot.boots === null
                          ? 'Unknown'
                          : latest.inputSnapshot.boots
                            ? 'Boots'
                            : 'No Boot'}{' '}
                        ·{' '}
                        {latest.inputSnapshot.repairable === null
                          ? 'Unknown'
                          : latest.inputSnapshot.repairable
                            ? 'Repairable'
                            : 'Not Repairable'}
                      </strong>
                    </div>
                    <div className="rounded bg-stone-50 px-2.5 py-1.5 border border-stone-200/70">
                      <span className="text-stone-500">Condition / Battery:</span>{' '}
                      <strong className="capitalize">
                        {latest.inputSnapshot.condition} ·{' '}
                        {latest.inputSnapshot.batterySafety.replace('_', ' ')}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive "What-If?" Parts Cost Explorer (Non-destructive) */}
        <div className="no-print rounded-lg border border-stone-200 bg-stone-50/60 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal-800" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                What-If Parts Cost Simulator (Non-Destructive)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWhatIf((prev) => !prev)}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline self-start sm:self-auto cursor-pointer"
            >
              {showWhatIf ? 'Hide Simulator' : 'Test Alternative Parts Cost'}
            </button>
          </div>

          {showWhatIf && (
            <div className="mt-3 pt-3 border-t border-stone-200 space-y-3">
              <p className="text-xs text-stone-600">
                Adjust hypothetical replacement parts cost below to preview how the v1.0.0 engine would classify this device <em>without overwriting the saved assessment history</em>.
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label
                    htmlFor="what-if-parts-input"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    Hypothetical Parts Cost ($ USD)
                  </label>
                  <input
                    id="what-if-parts-input"
                    type="number"
                    min="0"
                    max="2000"
                    step="1"
                    value={whatIfPartsDollars}
                    onChange={(e) => setWhatIfPartsDollars(e.target.value)}
                    className="w-40 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
                {whatIfResult && (
                  <div className="flex flex-wrap items-center gap-3 rounded-md bg-white border border-stone-200 px-3.5 py-2 text-xs">
                    <span className="text-stone-500">Simulated Outcome:</span>
                    <DecisionBadge decision={whatIfResult.decision} />
                    <span className="text-stone-700">
                      Repair Cost: <strong>{formatCents(whatIfResult.repairCostCents)}</strong>
                    </span>
                    <span className="text-stone-700">
                      Net Margin: <strong>{formatCents(whatIfResult.marginCents)}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Assessment History Snapshot Selector */}
        {device.assessments.length > 1 && (
          <div className="no-print border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              {showHistory
                ? 'Hide Immutable Assessment History'
                : `View All ${device.assessments.length} Immutable Assessment Snapshots`}
            </button>
            {showHistory && (
              <div className="mt-2 space-y-2">
                {device.assessments.map((snap, idx) => (
                  <div
                    key={snap.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-200 bg-stone-50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-500">
                        #{device.assessments.length - idx}
                      </span>
                      <DecisionBadge decision={snap.decision} />
                      <span className="text-stone-600">
                        Cost: {formatCents(snap.repairCostCents)} · Margin:{' '}
                        {formatCents(snap.marginCents)}
                      </span>
                    </div>
                    <span className="text-stone-500">
                      {formatDateTime(snap.createdAt)} · {snap.assessedByName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
