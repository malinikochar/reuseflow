'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calculator,
  PieChart,
  RotateCcw,
  Save,
  ShieldCheck,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import {
  Device,
  EngineConfig,
  ScenarioInput,
  UserRole,
} from '@/types/domain';
import {
  calculateScenarioImpact,
  DEFAULT_SCENARIO_INPUT,
} from '@/lib/decision/scenario';
import { DEFAULT_ENGINE_CONFIG, formatCents } from '@/lib/decision/engine';
import { MetricCard } from '@/components/shared/badges-and-banners';

export function OperationsDashboardOverview({
  devices,
  engineConfig,
}: {
  devices: Device[];
  engineConfig: EngineConfig;
}) {
  const totalDevices = devices.length;
  const refurbCandidates = devices.filter(
    (d) => d.latestAssessment?.decision === 'REFURBISH_CANDIDATE'
  ).length;
  const reviewOnlyCount = devices.filter(
    (d) => d.latestAssessment?.decision === 'REVIEW_REQUIRED'
  ).length;
  const insufficientCount = devices.filter(
    (d) => d.latestAssessment?.decision === 'INSUFFICIENT_DATA' || !d.latestAssessment
  ).length;
  const recycleCount = devices.filter(
    (d) => d.latestAssessment?.decision === 'RECYCLE_REVIEW'
  ).length;
  const reviewRequired = reviewOnlyCount + insufficientCount;
  const quarantined = devices.filter(
    (d) => d.status === 'quarantined' || d.latestAssessment?.decision === 'QUARANTINE'
  ).length;

  const laptops = devices.filter((d) => d.category === 'laptop').length;
  const desktops = devices.filter((d) => d.category === 'desktop').length;
  const tablets = devices.filter((d) => d.category === 'tablet').length;

  const positiveMarginSumCents = devices
    .filter((d) => d.latestAssessment?.decision === 'REFURBISH_CANDIDATE')
    .reduce((acc, d) => acc + (d.latestAssessment?.marginCents ?? 0), 0);

  const candidateComparableSumCents = devices
    .filter((d) => d.latestAssessment?.decision === 'REFURBISH_CANDIDATE')
    .reduce((acc, d) => acc + (d.comparableValueCents ?? 0), 0);

  const candidateRepairCostSumCents = devices
    .filter((d) => d.latestAssessment?.decision === 'REFURBISH_CANDIDATE')
    .reduce((acc, d) => acc + (d.latestAssessment?.repairCostCents ?? 0), 0);

  const pendingSanitizationCount = devices.filter(
    (d) => d.storagePresent && d.sanitizationStatus === 'pending'
  ).length;

  // Apple Activity-Style 3-Gate Telemetry Percentages
  const safeTotal = Math.max(1, totalDevices);
  const batteryPassCount = devices.filter((d) => d.batterySafety === 'normal').length;
  const batteryPassPct = Math.round((batteryPassCount / safeTotal) * 100);

  const sanitizationPassCount = devices.filter(
    (d) => !d.storagePresent || d.sanitizationStatus === 'verified'
  ).length;
  const sanitizationPassPct = Math.round((sanitizationPassCount / safeTotal) * 100);

  const positiveMarginCount = devices.filter(
    (d) =>
      d.latestAssessment?.marginCents !== null &&
      d.latestAssessment?.marginCents !== undefined &&
      d.latestAssessment.marginCents >= engineConfig.minMarginCents
  ).length;
  const positiveMarginPct = Math.round((positiveMarginCount / safeTotal) * 100);

  // Donut Chart Segments for Live Triage Distribution
  const donutSegments = [
    { label: 'Refurbish Candidate', count: refurbCandidates, color: '#10B981' },
    { label: 'Review Required', count: reviewOnlyCount, color: '#6366F1' },
    { label: 'Recycle Review', count: recycleCount, color: '#EF4444' },
    { label: 'Safety Quarantine', count: quarantined, color: '#F59E0B' },
    { label: 'Insufficient Data', count: insufficientCount, color: '#9CA3AF' },
  ];
  const donutRadius = 42;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulativeFraction = 0;

  // Unit-by-unit bar chart scale
  const maxUnitDollars = Math.max(
    200,
    ...devices.map((d) =>
      Math.max(
        (d.comparableValueCents ?? 0) / 100,
        (d.latestAssessment?.repairCostCents ?? 0) / 100
      )
    )
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Devices in Queue"
          value={totalDevices}
          subtext={`Mix: ${laptops} laptops · ${desktops} desktops · ${tablets} tablets`}
          accent="default"
        />
        <MetricCard
          label="Refurbish Candidates"
          value={refurbCandidates}
          subtext={`Est. candidate net margin: ${formatCents(positiveMarginSumCents)}`}
          accent="emerald"
        />
        <MetricCard
          label="Needs Technician / Mgr Review"
          value={reviewRequired}
          subtext="Borderline margin, low RAM, or missing inputs"
          accent="sky"
        />
        <MetricCard
          label="Safety Quarantined"
          value={quarantined}
          subtext="Swollen battery or physical containment holds"
          accent="amber"
        />
      </div>

      {/* Apple.com-Inspired Live Interactive Bento Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Queue Triage Distribution Ring Chart */}
        <div className="lg:col-span-4 genesis-card p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#6366F1]/12 flex items-center justify-center text-[#4F46E5]">
                <PieChart className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-[14px] font-bold text-[#1D1D1F]">
                  Live Triage Distribution
                </h3>
                <p className="text-[11px] text-[#6E6E73]">
                  Rule Engine v{engineConfig.ruleVersion} queue breakdown
                </p>
              </div>
            </div>
            <span className="font-mono text-[11px] text-[#6E6E73]">
              {totalDevices} units
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 108 108"
                className="h-28 w-28 -rotate-90"
                aria-label="Queue triage decision distribution donut chart"
              >
                <circle
                  cx="54"
                  cy="54"
                  r={donutRadius}
                  fill="none"
                  stroke="#F2F2F7"
                  strokeWidth="12"
                />
                {donutSegments.map((seg) => {
                  if (seg.count <= 0) return null;
                  const frac = seg.count / safeTotal;
                  const dashLength = frac * donutCircumference;
                  const dashOffset = -cumulativeFraction * donutCircumference;
                  cumulativeFraction += frac;
                  return (
                    <circle
                      key={seg.label}
                      cx="54"
                      cy="54"
                      r={donutRadius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={`${dashLength} ${donutCircumference}`}
                      strokeDashoffset={dashOffset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-[22px] font-bold text-[#1D1D1F] leading-none">
                  {totalDevices}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6E73] mt-0.5">
                  Units
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 text-[11px]">
              {donutSegments.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[#6E6E73] truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="truncate">{seg.label}</span>
                  </span>
                  <span className="font-mono font-semibold text-[#1D1D1F]">
                    {seg.count} ({Math.round((seg.count / safeTotal) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Apple Activity-Style 3-Gate Concentric Safety & Margin Rings */}
        <div className="lg:col-span-4 genesis-card p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#10B981]/12 flex items-center justify-center text-[#065F46]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-[14px] font-bold text-[#1D1D1F]">
                  3-Gate Compliance Rings
                </h3>
                <p className="text-[11px] text-[#6E6E73]">
                  Safety, Sanitization & Margin telemetry
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#10B981]/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#065F46]">
              Live Gates
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 112 112"
                className="h-28 w-28 -rotate-90"
                aria-label="Concentric compliance telemetry rings"
              >
                {/* Outer Ring: Battery Safety (r=44) */}
                <circle cx="56" cy="56" r="44" fill="none" stroke="#FEF3C7" strokeWidth="7" />
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - batteryPassPct / 100)}
                />
                {/* Middle Ring: Sanitization Gate (r=33) */}
                <circle cx="56" cy="56" r="33" fill="none" stroke="#E0E7FF" strokeWidth="7" />
                <circle
                  cx="56"
                  cy="56"
                  r="33"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 33}
                  strokeDashoffset={2 * Math.PI * 33 * (1 - sanitizationPassPct / 100)}
                />
                {/* Inner Ring: Positive Margin (r=22) */}
                <circle cx="56" cy="56" r="22" fill="none" stroke="#D1FAE5" strokeWidth="7" />
                <circle
                  cx="56"
                  cy="56"
                  r="22"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - positiveMarginPct / 100)}
                />
              </svg>
            </div>

            <div className="flex-1 space-y-2.5 text-[11px]">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                    <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                    Battery Normal
                  </span>
                  <span className="font-mono font-semibold text-[#1D1D1F]">
                    {batteryPassPct}% ({batteryPassCount}/{totalDevices})
                  </span>
                </div>
                <p className="text-[10px] text-[#6E6E73] pl-3.5">
                  {quarantined} unit(s) in lithium-ion quarantine
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                    <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
                    Wipe Gate Cleared
                  </span>
                  <span className="font-mono font-semibold text-[#1D1D1F]">
                    {sanitizationPassPct}% ({sanitizationPassCount}/{totalDevices})
                  </span>
                </div>
                <p className="text-[10px] text-[#6E6E73] pl-3.5">
                  {pendingSanitizationCount} storage unit(s) awaiting wipe
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                    <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                    Margin ≥ {formatCents(engineConfig.minMarginCents)}
                  </span>
                  <span className="font-mono font-semibold text-[#065F46]">
                    {positiveMarginPct}% ({positiveMarginCount}/{totalDevices})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Unit-by-Unit Value vs. Repair Cost Telemetry Chart */}
        <div className="lg:col-span-4 genesis-card p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#6366F1]/12 flex items-center justify-center text-[#4F46E5]">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-[14px] font-bold text-[#1D1D1F]">
                  Unit Economics Telemetry
                </h3>
                <p className="text-[11px] text-[#6E6E73]">
                  Comparable Value vs. Total Repair Cost
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="inline-flex items-center gap-1 text-[#6366F1]">
                <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
                Value
              </span>
              <span className="inline-flex items-center gap-1 text-[#F59E0B]">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                Cost
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-[124px] overflow-y-auto pr-1">
            {devices.slice(0, 5).map((d) => {
              const valDollars = (d.comparableValueCents ?? 0) / 100;
              const costDollars = (d.latestAssessment?.repairCostCents ?? 0) / 100;
              const marginCents = d.latestAssessment?.marginCents ?? null;
              const valPct = Math.min(100, Math.round((valDollars / maxUnitDollars) * 100));
              const costPct = Math.min(100, Math.round((costDollars / maxUnitDollars) * 100));

              return (
                <div key={d.id} className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#1D1D1F] font-medium truncate max-w-[165px]">
                      {d.assetTag} · {d.model}
                    </span>
                    <span
                      className={`font-mono font-semibold ${
                        marginCents === null
                          ? 'text-[#86868B]'
                          : marginCents >= 0
                            ? 'text-[#065F46]'
                            : 'text-[#991B1B]'
                      }`}
                    >
                      {marginCents === null
                        ? d.batterySafety === 'swollen'
                          ? 'HAZARD'
                          : 'N/A'
                        : `${marginCents >= 0 ? '+' : ''}${formatCents(marginCents)}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#6366F1]"
                        style={{ width: `${valPct}%` }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F59E0B]"
                        style={{ width: `${costPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Queue Economic Waterfall & Governance Strip */}
      <div className="genesis-card px-5 py-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
        <div className="flex items-center justify-between sm:block rounded-xl bg-[#FAFAFC] border border-[#E5E5EA] px-3.5 py-2">
          <span className="text-[#6E6E73] block">Candidate Gross Comparable Value</span>
          <span className="font-mono font-semibold text-[14px] text-[#1D1D1F]">
            {formatCents(candidateComparableSumCents)}
          </span>
        </div>
        <div className="flex items-center justify-between sm:block rounded-xl bg-[#FAFAFC] border border-[#E5E5EA] px-3.5 py-2">
          <span className="text-[#6E6E73] block">Est. Candidate Repair Cost (Parts+Labor+OH)</span>
          <span className="font-mono font-semibold text-[14px] text-[#1D1D1F]">
            {formatCents(candidateRepairCostSumCents)}
          </span>
        </div>
        <div className="flex items-center justify-between sm:block rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 px-3.5 py-2">
          <span className="text-[#065F46] block">Net Refurbishment Value Unlocked</span>
          <span className="font-mono font-semibold text-[14px] text-[#065F46]">
            {formatCents(positiveMarginSumCents)}
          </span>
        </div>
        <div className="flex items-center justify-between sm:block rounded-xl bg-[#FAFAFC] border border-[#E5E5EA] px-3.5 py-2">
          <span className="text-[#6E6E73] block">Storage Sanitization Gate Holds</span>
          <span className="font-mono font-semibold text-[14px] text-[#1D1D1F]">
            {pendingSanitizationCount} pending external wipe
          </span>
        </div>
      </div>

      {/* Category & Workflow Breakdown Bar */}
      <div className="genesis-card px-5 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-[12px] text-[#6E6E73]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#1D1D1F]">
            <BarChart3 className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
            Active Rule Assumptions (v{engineConfig.ruleVersion}):
          </span>
          <span className="rounded-lg bg-[#FAFAFC] px-2.5 py-1 border border-[#E5E5EA] font-mono text-[#1D1D1F]">
            Labor: {formatCents(engineConfig.hourlyRateCents)}/hr
          </span>
          <span className="rounded-lg bg-[#FAFAFC] px-2.5 py-1 border border-[#E5E5EA] font-mono text-[#1D1D1F]">
            Min Margin: {formatCents(engineConfig.minMarginCents)}
          </span>
          <span className="rounded-lg bg-[#FAFAFC] px-2.5 py-1 border border-[#E5E5EA] font-mono text-[#1D1D1F]">
            Min Laptop RAM: {engineConfig.minLaptopRamGb} GB
          </span>
          <span className="rounded-lg bg-[#FAFAFC] px-2.5 py-1 border border-[#E5E5EA] font-mono text-[#1D1D1F]">
            Overhead: {formatCents(engineConfig.overheadCents)}
          </span>
        </div>
        <span className="text-[#86868B]">
          All economic thresholds are configurable product hypotheses.
        </span>
      </div>
    </div>
  );
}

export function ScenarioLab({
  engineConfig = DEFAULT_ENGINE_CONFIG,
  actorRole = 'manager',
  onUpdateEngineConfig,
}: {
  engineConfig?: EngineConfig;
  actorRole?: UserRole;
  onUpdateEngineConfig?: (
    nextConfig: EngineConfig
  ) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [scenario, setScenario] = useState<ScenarioInput>({
    ...DEFAULT_SCENARIO_INPUT,
    baselineMinutesPerDevice: engineConfig.baselineMinutes,
    proposedMinutesPerDevice: engineConfig.targetMinutes,
    hourlyLaborRateCents: engineConfig.hourlyRateCents,
  });

  const [editHourlyDollars, setEditHourlyDollars] = useState(
    (engineConfig.hourlyRateCents / 100).toFixed(2)
  );
  const [editMinMarginDollars, setEditMinMarginDollars] = useState(
    (engineConfig.minMarginCents / 100).toFixed(2)
  );
  const [editMinRamGb, setEditMinRamGb] = useState(String(engineConfig.minLaptopRamGb));
  const [editOverheadDollars, setEditOverheadDollars] = useState(
    (engineConfig.overheadCents / 100).toFixed(2)
  );
  const [configMsg, setConfigMsg] = useState<string | null>(null);

  const output = calculateScenarioImpact(scenario);

  // Build 12-Month Cumulative Net Capacity Trajectory for Live SVG Area Chart
  const months = Array.from({ length: 12 }, (_, idx) => idx + 1);
  const monthlyTrajectoryCents = months.map(
    (m) => m * output.monthlyNetValueCents - scenario.implementationCostCents
  );
  const minVal = Math.min(0, -scenario.implementationCostCents, ...monthlyTrajectoryCents);
  const maxVal = Math.max(10000, ...monthlyTrajectoryCents);
  const valRange = Math.max(1, maxVal - minVal);

  const chartW = 360;
  const chartH = 112;
  const padX = 12;
  const padY = 14;
  const usableW = chartW - padX * 2;
  const usableH = chartH - padY * 2;

  const toX = (idx: number) => padX + (idx / 11) * usableW;
  const toY = (val: number) => padY + usableH - ((val - minVal) / valRange) * usableH;
  const zeroY = toY(0);

  const linePoints = monthlyTrajectoryCents
    .map((val, idx) => `${toX(idx).toFixed(1)},${toY(val).toFixed(1)}`)
    .join(' ');
  const areaPath = `M ${toX(0).toFixed(1)},${zeroY.toFixed(1)} L ${monthlyTrajectoryCents
    .map((val, idx) => `${toX(idx).toFixed(1)},${toY(val).toFixed(1)}`)
    .join(' L ')} L ${toX(11).toFixed(1)},${zeroY.toFixed(1)} Z`;

  const yearOneCumulativeCents = monthlyTrajectoryCents[11] ?? 0;

  const handleResetScenario = () => {
    setScenario({ ...DEFAULT_SCENARIO_INPUT });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateEngineConfig) return;
    setConfigMsg(null);

    const nextConfig: EngineConfig = {
      ruleVersion: '1.0.0',
      hourlyRateCents: Math.max(
        0,
        Math.round((Number.parseFloat(editHourlyDollars) || 0) * 100)
      ),
      minMarginCents: Math.round((Number.parseFloat(editMinMarginDollars) || 0) * 100),
      minLaptopRamGb: Math.max(1, Number.parseInt(editMinRamGb, 10) || 8),
      overheadCents: Math.max(
        0,
        Math.round((Number.parseFloat(editOverheadDollars) || 0) * 100)
      ),
      baselineMinutes: Math.max(1, Math.round(scenario.baselineMinutesPerDevice)),
      targetMinutes: Math.max(1, Math.round(scenario.proposedMinutesPerDevice)),
    };

    const res = await onUpdateEngineConfig(nextConfig);
    if (res.ok) {
      setConfigMsg('Updated illustrative engine thresholds for subsequent assessments.');
    } else {
      setConfigMsg(res.message ?? 'Could not update engine configuration.');
    }
  };

  return (
    <div className="space-y-6">
      <section
        aria-label="Scenario Lab Hypothetical Business Impact Model"
        className="genesis-card overflow-hidden"
      >
        <div className="border-b border-[#E5E5EA] bg-[#FFFFFF] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Calculator className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              <h3 className="font-display text-[18px] font-bold text-[#1D1D1F]">
                Scenario Lab — Hypothetical Triage Capacity Calculator
              </h3>
              <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1 text-[12px] font-medium text-[#92400E]">
                Illustrative scenario · not measured organizational performance
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#6E6E73]">
              Inputs can be edited; estimates depend on assumptions. Labor value represents hypothetical bench capacity, not necessarily cash savings or incremental revenue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetScenario}
            className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#6E6E73]" aria-hidden="true" />
            Reset to Seed (100 devices / $200)
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="genesis-panel bg-[#FAFAFC] p-4">
                <div className="flex justify-between text-[13px] font-medium text-[#1D1D1F] mb-2">
                  <label htmlFor="scenario-devices-month">Monthly Device Volume</label>
                  <span className="font-mono text-[#6366F1]">
                    {scenario.devicesPerMonth} devices/mo
                  </span>
                </div>
                <input
                  id="scenario-devices-month"
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={scenario.devicesPerMonth}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      devicesPerMonth: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full accent-[#6366F1] cursor-pointer"
                />
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    aria-label="Monthly device volume numeric input"
                    type="number"
                    min="0"
                    max="100000"
                    value={scenario.devicesPerMonth}
                    onChange={(e) =>
                      setScenario({
                        ...scenario,
                        devicesPerMonth: Math.max(
                          0,
                          Number.parseInt(e.target.value, 10) || 0
                        ),
                      })
                    }
                    className="genesis-input w-24 py-1.5 px-2.5 font-mono"
                  />
                  <span className="text-[12px] text-[#86868B]">Seed default: 100/mo</span>
                </div>
              </div>

              <div className="genesis-panel bg-[#FAFAFC] p-4">
                <div className="flex justify-between text-[13px] font-medium text-[#1D1D1F] mb-2">
                  <label htmlFor="scenario-hourly-rate">Loaded Labor Rate ($/hr)</label>
                  <span className="font-mono text-[#6366F1]">
                    {formatCents(scenario.hourlyLaborRateCents)}/hr
                  </span>
                </div>
                <input
                  id="scenario-hourly-rate"
                  type="range"
                  min="1000"
                  max="6000"
                  step="100"
                  value={scenario.hourlyLaborRateCents}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      hourlyLaborRateCents: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full accent-[#6366F1] cursor-pointer"
                />
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    aria-label="Hourly labor rate in dollars"
                    type="number"
                    min="0"
                    max="500"
                    step="1"
                    value={(scenario.hourlyLaborRateCents / 100).toFixed(0)}
                    onChange={(e) =>
                      setScenario({
                        ...scenario,
                        hourlyLaborRateCents: Math.max(
                          0,
                          Math.round((Number.parseFloat(e.target.value) || 0) * 100)
                        ),
                      })
                    }
                    className="genesis-input w-24 py-1.5 px-2.5 font-mono"
                  />
                  <span className="text-[12px] text-[#86868B]">Seed default: $20/hr</span>
                </div>
              </div>

              <div className="genesis-panel bg-[#FAFAFC] p-4">
                <label
                  htmlFor="scenario-baseline-mins"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Current Manual Assessment Minutes / Device
                </label>
                <input
                  id="scenario-baseline-mins"
                  type="number"
                  min="0"
                  max="240"
                  step="1"
                  value={scenario.baselineMinutesPerDevice}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      baselineMinutesPerDevice: Math.max(
                        0,
                        Number.parseFloat(e.target.value) || 0
                      ),
                    })
                  }
                  className="genesis-input w-full font-mono"
                />
                <span className="mt-1.5 block text-[12px] text-[#86868B]">
                  Hypothetical manual baseline (Seed: 12 min)
                </span>
              </div>

              <div className="genesis-panel bg-[#FAFAFC] p-4">
                <label
                  htmlFor="scenario-proposed-mins"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Proposed ReuseFlow Assessment Minutes / Device
                </label>
                <input
                  id="scenario-proposed-mins"
                  type="number"
                  min="0"
                  max="240"
                  step="1"
                  value={scenario.proposedMinutesPerDevice}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      proposedMinutesPerDevice: Math.max(
                        0,
                        Number.parseFloat(e.target.value) || 0
                      ),
                    })
                  }
                  className="genesis-input w-full font-mono"
                />
                <span className="mt-1.5 block text-[12px] text-[#86868B]">
                  Hypothetical structured intake target (Seed: 6 min)
                </span>
              </div>

              <div className="genesis-panel bg-[#FAFAFC] p-4">
                <label
                  htmlFor="scenario-impl-cost"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Estimated One-Time Implementation Cost ($ USD)
                </label>
                <input
                  id="scenario-impl-cost"
                  type="number"
                  min="0"
                  max="500000"
                  step="50"
                  value={(scenario.implementationCostCents / 100).toFixed(0)}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      implementationCostCents: Math.max(
                        0,
                        Math.round((Number.parseFloat(e.target.value) || 0) * 100)
                      ),
                    })
                  }
                  className="genesis-input w-full font-mono"
                />
                <span className="mt-1.5 block text-[12px] text-[#86868B]">
                  Enter pilot training/setup cost for realistic payback
                </span>
              </div>

              <div className="genesis-panel bg-[#FAFAFC] p-4">
                <label
                  htmlFor="scenario-monthly-software"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Monthly Software / Hosting Cost ($ USD)
                </label>
                <input
                  id="scenario-monthly-software"
                  type="number"
                  min="0"
                  max="50000"
                  step="10"
                  value={(scenario.monthlySoftwareCostCents / 100).toFixed(0)}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      monthlySoftwareCostCents: Math.max(
                        0,
                        Math.round((Number.parseFloat(e.target.value) || 0) * 100)
                      ),
                    })
                  }
                  className="genesis-input w-full font-mono"
                />
                <span className="mt-1.5 block text-[12px] text-[#86868B]">
                  Subtracted from monthly labor capacity value
                </span>
              </div>
            </div>
          </div>

          {/* Live Calculated Outputs + Live 12-Month SVG Trajectory Chart */}
          <div className="lg:col-span-5 flex flex-col justify-between genesis-panel bg-[#FAFAFC] p-5 space-y-4">
            <div className="space-y-3">
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                Live Scenario Arithmetic Output
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6E6E73]">Minutes Saved / Device</p>
                  <p className="mt-1 font-display text-[24px] font-bold text-[#1D1D1F]">
                    {output.minutesSavedPerDevice} min
                  </p>
                </div>
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6E6E73]">Monthly Hours Reallocated</p>
                  <p className="mt-1 font-display text-[24px] font-bold text-[#1D1D1F]">
                    {output.monthlyHoursSaved} hrs/mo
                  </p>
                </div>
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6E6E73]">Hypothetical Labor Value</p>
                  <p className="mt-1 font-display text-[24px] font-bold text-[#1D1D1F]">
                    {formatCents(output.monthlyLaborValueCents)}/mo
                  </p>
                </div>
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6E6E73]">Net Monthly Capacity Value</p>
                  <p
                    className={`mt-1 font-display text-[24px] font-bold ${
                      output.monthlyNetValueCents >= 0
                        ? 'text-[#10B981]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {formatCents(output.monthlyNetValueCents)}/mo
                  </p>
                </div>
              </div>

              {/* Apple-Style Live 12-Month Cumulative Capacity Curve */}
              <div className="genesis-panel p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1D1D1F]">
                    <TrendingUp className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                    12-Month Cumulative Capacity Trajectory
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-[#065F46]">
                    Yr 1: {formatCents(yearOneCumulativeCents)}
                  </span>
                </div>
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full h-24 overflow-visible"
                  aria-label="12-month cumulative net capacity trajectory chart"
                >
                  <defs>
                    <linearGradient id="scenarioAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Zero baseline */}
                  <line
                    x1={padX}
                    y1={zeroY}
                    x2={chartW - padX}
                    y2={zeroY}
                    stroke="#D1D1D6"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Shaded Area */}
                  <path d={areaPath} fill="url(#scenarioAreaGrad)" />
                  {/* Trajectory Line */}
                  <polyline
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={linePoints}
                  />
                  {/* Data Nodes */}
                  {monthlyTrajectoryCents.map((val, idx) => (
                    <circle
                      key={idx}
                      cx={toX(idx)}
                      cy={toY(val)}
                      r="2.75"
                      fill={val >= 0 ? '#10B981' : '#F59E0B'}
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
                <div className="flex justify-between text-[10px] font-mono text-[#86868B]">
                  <span>M1 ({formatCents(monthlyTrajectoryCents[0] ?? 0)})</span>
                  <span>M6 ({formatCents(monthlyTrajectoryCents[5] ?? 0)})</span>
                  <span>M12 ({formatCents(yearOneCumulativeCents)})</span>
                </div>
              </div>

              <div className="genesis-panel p-3.5">
                <p className="text-[12px] text-[#6E6E73]">Simple Payback Estimate</p>
                <p className="mt-1 text-[14px] font-medium text-[#1D1D1F]">
                  {output.paybackLabel}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3.5 text-[12px] text-[#92400E] space-y-1">
              <p className="font-medium flex items-center gap-1.5 text-[#1D1D1F]">
                <AlertCircle className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" aria-hidden="true" />
                Honest Claim Discipline
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[12px] text-[#6E6E73]">
                <li>Illustrative scenario · not measured organizational performance.</li>
                <li>Inputs can be edited; estimates depend on assumptions.</li>
                <li>Labor value is not necessarily cash savings or incremental revenue.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* P1 Editable Economic Assumptions (Manager Settings) */}
      {onUpdateEngineConfig && (
        <section
          aria-label="Editable Engine Economic Thresholds"
          className="genesis-card overflow-hidden"
        >
          <div className="border-b border-[#E5E5EA] bg-[#FFFFFF] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
              <h3 className="font-display text-[16px] font-bold text-[#1D1D1F]">
                Configurable Decision Engine Thresholds (v1.0.0 Assumptions)
              </h3>
            </div>
            <span className="text-[12px] text-[#86868B]">Manager-only configuration</span>
          </div>

          <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
            {configMsg && (
              <div className="rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-2.5 text-[12px] font-medium text-[#065F46]">
                {configMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="cfg-hourly-rate"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Technician Labor Rate ($/hr)
                </label>
                <input
                  id="cfg-hourly-rate"
                  type="number"
                  step="0.50"
                  min="0"
                  disabled={actorRole !== 'manager'}
                  value={editHourlyDollars}
                  onChange={(e) => setEditHourlyDollars(e.target.value)}
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-min-margin"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Min Positive Margin ($ USD)
                </label>
                <input
                  id="cfg-min-margin"
                  type="number"
                  step="1"
                  disabled={actorRole !== 'manager'}
                  value={editMinMarginDollars}
                  onChange={(e) => setEditMinMarginDollars(e.target.value)}
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-min-ram"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Min Laptop RAM Heuristic (GB)
                </label>
                <input
                  id="cfg-min-ram"
                  type="number"
                  step="1"
                  min="1"
                  disabled={actorRole !== 'manager'}
                  value={editMinRamGb}
                  onChange={(e) => setEditMinRamGb(e.target.value)}
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-overhead"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Processing Overhead ($ USD)
                </label>
                <input
                  id="cfg-overhead"
                  type="number"
                  step="1"
                  min="0"
                  disabled={actorRole !== 'manager'}
                  value={editOverheadDollars}
                  onChange={(e) => setEditOverheadDollars(e.target.value)}
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFC]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[12px] text-[#86868B]">
                Updating thresholds applies to new assessments while preserving historic assessment snapshots.
              </p>
              <button
                type="submit"
                disabled={actorRole !== 'manager'}
                className="genesis-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-[13px] disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                Save Assumptions
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Strategic Alternatives Tradeoff Matrix (FUSE Case Alignment) */}
      <section
        aria-label="Strategic Implementation Alternatives Comparison"
        className="genesis-card overflow-hidden"
      >
        <div className="border-b border-[#E5E5EA] bg-[#FFFFFF] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-display text-[16px] font-bold text-[#1D1D1F]">
              Strategic Alternatives Analysis — Refurbishment Triage Operating Model
            </h3>
            <p className="text-[12px] text-[#6E6E73]">
              Why a lightweight, deterministic decision-support workflow outperforms both ad-hoc spreadsheets and heavy custom ERP deployments.
            </p>
          </div>
          <span className="rounded-full bg-[#6366F1]/12 px-3 py-1 text-[11px] font-medium text-[#4F46E5] self-start sm:self-auto">
            Case Alignment Matrix
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
          <div className="genesis-panel bg-[#FAFAFC] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-[#1D1D1F]">
                1. Status Quo / Spreadsheets
              </span>
              <span className="rounded-full bg-[#E5E5EA] px-2.5 py-0.5 text-[11px] font-medium text-[#6E6E73]">
                Baseline
              </span>
            </div>
            <p className="text-[12px] text-[#6E6E73] leading-relaxed">
              Unstructured bench notes and subjective technician rules-of-thumb (~{scenario.baselineMinutesPerDevice} min/device).
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[12px] text-[#6E6E73]">
              <li>Labor sunk into negative-margin repairs before parts math is checked.</li>
              <li>No enforced database gate preventing un-wiped storage from reaching Ready.</li>
              <li>Difficult to audit why a device was harvested vs. refurbished.</li>
            </ul>
          </div>

          <div className="rounded-xl border-2 border-[#6366F1] bg-[#6366F1]/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-[#1D1D1F]">
                2. ReuseFlow v1.0.0 (Recommended)
              </span>
              <span className="rounded-full bg-[#10B981]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#065F46]">
                Best Fit
              </span>
            </div>
            <p className="text-[12px] text-[#1D1D1F] leading-relaxed">
              Structured intake + deterministic cost/margin rules + human-approved safety & sanitization gates (~{scenario.proposedMinutesPerDevice} min target).
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[12px] text-[#1D1D1F]">
              <li>Immediate swollen-battery quarantine before economic calculation.</li>
              <li>Explicit reason codes & integer-cent cost breakdown on every unit.</li>
              <li>Low adoption friction for volunteer & staff technicians; zero AI hallucination risk.</li>
            </ul>
          </div>

          <div className="genesis-panel bg-[#FAFAFC] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-[#1D1D1F]">
                3. Heavy Custom ERP / Auto-Wipe
              </span>
              <span className="rounded-full bg-[#F59E0B]/20 px-2.5 py-0.5 text-[11px] font-medium text-[#92400E]">
                High Risk
              </span>
            </div>
            <p className="text-[12px] text-[#6E6E73] leading-relaxed">
              Full warehouse ERP replacement with hardware-coupled automated imaging and e-commerce pricing feeds.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[12px] text-[#6E6E73]">
              <li>High upfront capex ($25k+) and multi-month implementation delay.</li>
              <li>Volatile scraped resale prices introduce noisy false positives.</li>
              <li>Over-automating disposal/wipe creates compliance and safety liability.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
