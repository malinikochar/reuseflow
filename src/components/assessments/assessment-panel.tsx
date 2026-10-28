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
      <div className="flex flex-wrap gap-2">
        {reasonCodes.map((code) => (
          <span
            key={code}
            className="inline-flex items-center rounded-[4px] bg-[#FAFAFA] border border-[#E8E8EC] px-2.5 py-1 font-mono text-[12px] text-[#0A0A0A]"
          >
            {code}
          </span>
        ))}
      </div>
      <ul className="space-y-1.5 text-[14px] text-[#0A0A0A] list-disc pl-5">
        {reasonDetails.map((detail, idx) => (
          <li key={idx} className="leading-relaxed text-[#6B6B6B]">
            <span className="text-[#0A0A0A]">{detail}</span>
          </li>
        ))}
      </ul>
      {missingFields.length > 0 && (
        <div className="rounded-[8px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 text-[12px] text-[#0A0A0A]">
          <span className="font-medium">Missing required fields for economic scoring: </span>
          <code className="font-mono">{missingFields.join(', ')}</code>
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
    <div className="genesis-panel p-4 bg-[#FAFAFA]">
      <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
            Repair Economics Breakdown (Integer Cents)
          </h4>
        </div>
        <span className="text-[12px] text-[#9C9C9C]">
          Illustrative threshold: {formatCents(minMarginCents)} min margin
        </span>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px]">
        <div className="genesis-panel p-3">
          <dt className="text-[12px] text-[#6B6B6B]">Parts Assumption</dt>
          <dd className="mt-1 font-mono font-medium text-[#0A0A0A]">
            {formatCents(partsCostCents)}
          </dd>
        </div>
        <div className="genesis-panel p-3">
          <dt className="text-[12px] text-[#6B6B6B]">
            Labor ({estimatedLaborMinutes}m @ {formatCents(hourlyRateCents)}/hr)
          </dt>
          <dd className="mt-1 font-mono font-medium text-[#0A0A0A]">
            {formatCents(laborCostCents)}
          </dd>
        </div>
        <div className="genesis-panel p-3">
          <dt className="text-[12px] text-[#6B6B6B]">Overhead Assumption</dt>
          <dd className="mt-1 font-mono font-medium text-[#0A0A0A]">
            {formatCents(overheadCents)}
          </dd>
        </div>
        <div className="genesis-panel p-3">
          <dt className="text-[12px] text-[#6B6B6B]">Total Estimated Repair Cost</dt>
          <dd className="mt-1 font-mono font-medium text-[#0A0A0A]">
            {formatCents(totalRepairCostCents)}
          </dd>
        </div>
        <div className="genesis-panel p-3">
          <dt className="text-[12px] text-[#6B6B6B]">Manual Comparable Value</dt>
          <dd className="mt-1 font-mono font-medium text-[#0A0A0A]">
            {formatCents(comparableValueCents)}
          </dd>
        </div>
        <div
          className={`rounded-[8px] p-3 border ${
            isNegativeMargin
              ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#991B1B]'
              : isPositiveMargin
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#065F46]'
                : 'bg-[#F59E0B]/12 border-[#F59E0B]/30 text-[#92400E]'
          }`}
        >
          <dt className="text-[12px] font-medium opacity-85">Estimated Net Margin</dt>
          <dd className="mt-1 font-mono font-medium text-[15px]">
            {formatCents(marginCents)}
          </dd>
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
      className="genesis-card overflow-hidden"
    >
      {/* Header Bar */}
      <div className="border-b border-[#E8E8EC] bg-[#FFFFFF] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-[18px] font-bold text-[#0A0A0A]">
              Recommended Action & Explainability
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAFAFA] border border-[#E8E8EC] px-3 py-1 text-[12px] font-medium text-[#6B6B6B]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
              Needs human approval
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#6B6B6B]">
            Deterministic Rule Engine{' '}
            <code className="font-mono text-[#0A0A0A]">
              v{latest?.ruleVersion ?? engineConfig.ruleVersion}
            </code>{' '}
            · Thresholds are configurable hypotheses, not industry standards.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          {actorRole !== 'viewer' && onRunAssessment && (
            <button
              type="button"
              onClick={onRunAssessment}
              disabled={isAssessing}
              className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
              {isAssessing ? 'Evaluating...' : 'Re-run Assessment'}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] cursor-pointer"
            title="Print non-PII bench assessment sheet"
          >
            <Printer className="h-3.5 w-3.5 text-[#6B6B6B]" aria-hidden="true" />
            Print Sheet
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <SafetyBanner batterySafety={device.batterySafety} status={device.status} />

        {latest ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 genesis-panel p-4 bg-[#FAFAFA]">
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                Engine Recommendation
              </span>
              <div className="mt-2 flex items-center gap-2">
                <DecisionBadge decision={latest.decision} />
              </div>
              <span className="mt-2 block text-[12px] text-[#9C9C9C]">
                Evaluated {formatDateTime(latest.createdAt)} by {latest.assessedByName}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                Physical Safety Gate
              </span>
              <div className="mt-2">
                {device.batterySafety === 'swollen' ? (
                  <span className="inline-flex items-center rounded-full bg-[#F59E0B]/20 px-3 py-1 text-[12px] font-medium text-[#92400E]">
                    Locked — Swollen Battery Quarantine
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#10B981]/12 px-3 py-1 text-[12px] font-medium text-[#065F46]">
                    Open — Battery {device.batterySafety.replace('_', ' ')}
                  </span>
                )}
              </div>
              <span className="mt-2 block text-[12px] text-[#9C9C9C]">
                Evaluated before any cost calculation
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                Ready / Disposition Sanitization Gate
              </span>
              <div className="mt-2">
                <SanitizationBadge
                  storagePresent={device.storagePresent}
                  status={device.sanitizationStatus}
                />
              </div>
              <span className="mt-2 block text-[12px] text-[#9C9C9C]">
                {latest.sanitizationGateOpen
                  ? 'Clear for ready/closed transition when repair finishes'
                  : 'Blocks ready/closed until external wipe is verified'}
              </span>
            </div>
          </div>
        ) : (
          <div className="genesis-panel p-6 text-center text-[13px] text-[#6B6B6B]">
            No assessment snapshot recorded yet. Click <span className="font-medium text-[#0A0A0A]">Re-run Assessment</span> to evaluate this device.
          </div>
        )}

        {latest && (
          <div className="genesis-panel overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedWhy((prev) => !prev)}
              aria-expanded={expandedWhy}
              className="w-full flex items-center justify-between bg-[#FAFAFA] hover:bg-[#F4F4F6] px-4 py-3 text-left text-[13px] font-medium text-[#0A0A0A] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
                Why this result? ({latest.reasonCodes.length} triggered rule{' '}
                {latest.reasonCodes.length === 1 ? 'code' : 'codes'})
              </span>
              {expandedWhy ? (
                <ChevronUp className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
              )}
            </button>

            {expandedWhy && (
              <div className="p-5 space-y-5 bg-[#FFFFFF] border-t border-[#E8E8EC]">
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
                  <div className="genesis-panel bg-[#FAFAFA] p-3 text-[12px] text-[#6B6B6B]">
                    Cost breakdown not computed because{' '}
                    {latest.decision === 'QUARANTINE'
                      ? 'safety quarantine takes priority before economic scoring.'
                      : 'required cost or condition inputs are incomplete.'}
                  </div>
                )}

                <div className="pt-3 border-t border-[#E8E8EC]">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#9C9C9C] mb-2.5">
                    Snapshot Inputs Used (Immutable Assessment #{latest.id.slice(-6)})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[12px] text-[#6B6B6B]">
                    <div className="genesis-panel bg-[#FAFAFA] px-3 py-2">
                      <span>Category:</span>{' '}
                      <span className="font-medium text-[#0A0A0A] capitalize">
                        {latest.inputSnapshot.category}
                      </span>
                    </div>
                    <div className="genesis-panel bg-[#FAFAFA] px-3 py-2">
                      <span>RAM / Storage:</span>{' '}
                      <span className="font-mono text-[#0A0A0A]">
                        {latest.inputSnapshot.ramGb ?? '—'} GB /{' '}
                        {latest.inputSnapshot.storageGb ?? '—'} GB
                      </span>
                    </div>
                    <div className="genesis-panel bg-[#FAFAFA] px-3 py-2">
                      <span>Boots / Repairable:</span>{' '}
                      <span className="font-medium text-[#0A0A0A]">
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
                      </span>
                    </div>
                    <div className="genesis-panel bg-[#FAFAFA] px-3 py-2">
                      <span>Condition / Battery:</span>{' '}
                      <span className="font-medium text-[#0A0A0A] capitalize">
                        {latest.inputSnapshot.condition} ·{' '}
                        {latest.inputSnapshot.batterySafety.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive "What-If?" Parts Cost Explorer */}
        <div className="no-print genesis-panel bg-[#FAFAFA] p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                What-If Parts Cost Simulator (Non-Destructive)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWhatIf((prev) => !prev)}
              className="text-[12px] font-medium text-[#6366F1] hover:text-[#4F46E5] underline self-start sm:self-auto cursor-pointer"
            >
              {showWhatIf ? 'Hide Simulator' : 'Test Alternative Parts Cost'}
            </button>
          </div>

          {showWhatIf && (
            <div className="mt-3 pt-3 border-t border-[#E8E8EC] space-y-3">
              <p className="text-[12px] text-[#6B6B6B]">
                Adjust hypothetical replacement parts cost below to preview how the v1.0.0 engine would classify this device <em>without overwriting the saved assessment history</em>.
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label
                    htmlFor="what-if-parts-input"
                    className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
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
                    className="genesis-input w-40"
                  />
                </div>
                {whatIfResult && (
                  <div className="flex flex-wrap items-center gap-3 genesis-panel px-3.5 py-2 text-[12px]">
                    <span className="text-[#6B6B6B]">Simulated Outcome:</span>
                    <DecisionBadge decision={whatIfResult.decision} />
                    <span className="text-[#6B6B6B]">
                      Repair Cost:{' '}
                      <span className="font-mono text-[#0A0A0A]">
                        {formatCents(whatIfResult.repairCostCents)}
                      </span>
                    </span>
                    <span className="text-[#6B6B6B]">
                      Net Margin:{' '}
                      <span className="font-mono text-[#0A0A0A]">
                        {formatCents(whatIfResult.marginCents)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {device.assessments.length > 1 && (
          <div className="no-print border-t border-[#E8E8EC] pt-3">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B6B6B] hover:text-[#0A0A0A] cursor-pointer"
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
                    className="flex flex-wrap items-center justify-between gap-2 genesis-panel bg-[#FAFAFA] px-3 py-2 text-[12px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#9C9C9C]">
                        #{device.assessments.length - idx}
                      </span>
                      <DecisionBadge decision={snap.decision} />
                      <span className="text-[#6B6B6B]">
                        Cost: <span className="font-mono">{formatCents(snap.repairCostCents)}</span> ·
                        Margin: <span className="font-mono">{formatCents(snap.marginCents)}</span>
                      </span>
                    </div>
                    <span className="text-[#9C9C9C]">
                      {formatDateTime(snap.createdAt)} · {snap.assessedByName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shop-Floor Bench Traveler Verification Checklist (Visible on screen & optimized for Print Sheet) */}
        <div className="genesis-panel bg-[#FAFAFA] p-4 border-t border-[#E8E8EC] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#0A0A0A]">
              Shop-Floor Bench Traveler — Non-PII Verification & Sign-Off
            </span>
            <span className="font-mono text-[11px] text-[#6B6B6B]">
              Asset: {device.assetTag} · Status: {device.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
            <div className="rounded-[6px] bg-[#FFFFFF] border border-[#E8E8EC] px-3 py-2">
              <span className="block text-[11px] text-[#6B6B6B]">1. Physical Battery Check</span>
              <span className="font-medium text-[#0A0A0A]">
                {device.batterySafety === 'swollen'
                  ? 'HOLD — Swollen Battery Containment'
                  : `Cleared (${device.batterySafety.replace('_', ' ')})`}
              </span>
            </div>
            <div className="rounded-[6px] bg-[#FFFFFF] border border-[#E8E8EC] px-3 py-2">
              <span className="block text-[11px] text-[#6B6B6B]">2. External Wipe Reference</span>
              <span className="font-medium text-[#0A0A0A]">
                {!device.storagePresent
                  ? 'N/A (No Storage Media)'
                  : device.sanitizationStatus === 'verified'
                    ? `Verified (${device.sanitizationNote || 'External wipe logged'})`
                    : 'PENDING EXTERNAL VERIFICATION'}
              </span>
            </div>
            <div className="rounded-[6px] bg-[#FFFFFF] border border-[#E8E8EC] px-3 py-2">
              <span className="block text-[11px] text-[#6B6B6B]">3. Human Supervisor Disposition</span>
              <span className="font-medium text-[#0A0A0A] capitalize">
                {device.disposition
                  ? `${device.disposition.replace('_', ' ')} (${device.status})`
                  : `Pending Approval (${device.status})`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
