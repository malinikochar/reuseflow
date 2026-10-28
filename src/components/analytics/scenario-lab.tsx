'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calculator,
  RotateCcw,
  Save,
  Sliders,
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
  const reviewRequired = devices.filter(
    (d) =>
      d.latestAssessment?.decision === 'REVIEW_REQUIRED' ||
      d.latestAssessment?.decision === 'INSUFFICIENT_DATA'
  ).length;
  const quarantined = devices.filter(
    (d) => d.status === 'quarantined' || d.latestAssessment?.decision === 'QUARANTINE'
  ).length;

  const laptops = devices.filter((d) => d.category === 'laptop').length;
  const desktops = devices.filter((d) => d.category === 'desktop').length;
  const tablets = devices.filter((d) => d.category === 'tablet').length;

  const positiveMarginSumCents = devices
    .filter((d) => d.latestAssessment?.decision === 'REFURBISH_CANDIDATE')
    .reduce((acc, d) => acc + (d.latestAssessment?.marginCents ?? 0), 0);

  return (
    <div className="space-y-5">
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

      {/* Category & Workflow Breakdown Bar */}
      <div className="genesis-card px-5 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-[12px] text-[#6B6B6B]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#0A0A0A]">
            <BarChart3 className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
            Active Rule Assumptions (v{engineConfig.ruleVersion}):
          </span>
          <span className="rounded-[4px] bg-[#FAFAFA] px-2.5 py-1 border border-[#E8E8EC] font-mono text-[#0A0A0A]">
            Labor: {formatCents(engineConfig.hourlyRateCents)}/hr
          </span>
          <span className="rounded-[4px] bg-[#FAFAFA] px-2.5 py-1 border border-[#E8E8EC] font-mono text-[#0A0A0A]">
            Min Margin: {formatCents(engineConfig.minMarginCents)}
          </span>
          <span className="rounded-[4px] bg-[#FAFAFA] px-2.5 py-1 border border-[#E8E8EC] font-mono text-[#0A0A0A]">
            Min Laptop RAM: {engineConfig.minLaptopRamGb} GB
          </span>
          <span className="rounded-[4px] bg-[#FAFAFA] px-2.5 py-1 border border-[#E8E8EC] font-mono text-[#0A0A0A]">
            Overhead: {formatCents(engineConfig.overheadCents)}
          </span>
        </div>
        <span className="text-[#9C9C9C]">
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
        <div className="border-b border-[#E8E8EC] bg-[#FFFFFF] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Calculator className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              <h3 className="font-display text-[18px] font-bold text-[#0A0A0A]">
                Scenario Lab — Hypothetical Triage Capacity Calculator
              </h3>
              <span className="rounded-full bg-[#F59E0B]/15 px-3 py-1 text-[12px] font-medium text-[#92400E]">
                Illustrative scenario · not measured organizational performance
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#6B6B6B]">
              Inputs can be edited; estimates depend on assumptions. Labor value represents hypothetical bench capacity, not necessarily cash savings or incremental revenue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetScenario}
            className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#6B6B6B]" aria-hidden="true" />
            Reset to Seed (100 devices / $200)
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="genesis-panel bg-[#FAFAFA] p-4">
                <div className="flex justify-between text-[13px] font-medium text-[#0A0A0A] mb-2">
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
                  <span className="text-[12px] text-[#9C9C9C]">Seed default: 100/mo</span>
                </div>
              </div>

              <div className="genesis-panel bg-[#FAFAFA] p-4">
                <div className="flex justify-between text-[13px] font-medium text-[#0A0A0A] mb-2">
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
                  <span className="text-[12px] text-[#9C9C9C]">Seed default: $20/hr</span>
                </div>
              </div>

              <div className="genesis-panel bg-[#FAFAFA] p-4">
                <label
                  htmlFor="scenario-baseline-mins"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                <span className="mt-1.5 block text-[12px] text-[#9C9C9C]">
                  Hypothetical manual baseline (Seed: 12 min)
                </span>
              </div>

              <div className="genesis-panel bg-[#FAFAFA] p-4">
                <label
                  htmlFor="scenario-proposed-mins"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                <span className="mt-1.5 block text-[12px] text-[#9C9C9C]">
                  Hypothetical structured intake target (Seed: 6 min)
                </span>
              </div>

              <div className="genesis-panel bg-[#FAFAFA] p-4">
                <label
                  htmlFor="scenario-impl-cost"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                <span className="mt-1.5 block text-[12px] text-[#9C9C9C]">
                  Enter pilot training/setup cost for realistic payback
                </span>
              </div>

              <div className="genesis-panel bg-[#FAFAFA] p-4">
                <label
                  htmlFor="scenario-monthly-software"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                <span className="mt-1.5 block text-[12px] text-[#9C9C9C]">
                  Subtracted from monthly labor capacity value
                </span>
              </div>
            </div>
          </div>

          {/* Live Calculated Outputs */}
          <div className="lg:col-span-5 flex flex-col justify-between genesis-panel bg-[#FAFAFA] p-5 space-y-4">
            <div className="space-y-3">
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                Live Scenario Arithmetic Output
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6B6B6B]">Minutes Saved / Device</p>
                  <p className="mt-1 font-display text-[24px] font-bold text-[#0A0A0A]">
                    {output.minutesSavedPerDevice} min
                  </p>
                </div>
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6B6B6B]">Monthly Hours Reallocated</p>
                  <p className="mt-1 font-display text-[24px] font-bold text-[#0A0A0A]">
                    {output.monthlyHoursSaved} hrs/mo
                  </p>
                </div>
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6B6B6B]">Hypothetical Labor Value</p>
                  <p className="mt-1 font-display text-[24px] font-bold text-[#0A0A0A]">
                    {formatCents(output.monthlyLaborValueCents)}/mo
                  </p>
                </div>
                <div className="genesis-panel p-3.5">
                  <p className="text-[12px] text-[#6B6B6B]">Net Monthly Capacity Value</p>
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

              <div className="genesis-panel p-3.5">
                <p className="text-[12px] text-[#6B6B6B]">Simple Payback Estimate</p>
                <p className="mt-1 text-[14px] font-medium text-[#0A0A0A]">
                  {output.paybackLabel}
                </p>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3.5 text-[12px] text-[#92400E] space-y-1">
              <p className="font-medium flex items-center gap-1.5 text-[#0A0A0A]">
                <AlertCircle className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" aria-hidden="true" />
                Honest Claim Discipline
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[12px] text-[#6B6B6B]">
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
          <div className="border-b border-[#E8E8EC] bg-[#FFFFFF] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
              <h3 className="font-display text-[16px] font-bold text-[#0A0A0A]">
                Configurable Decision Engine Thresholds (v1.0.0 Assumptions)
              </h3>
            </div>
            <span className="text-[12px] text-[#9C9C9C]">Manager-only configuration</span>
          </div>

          <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
            {configMsg && (
              <div className="rounded-[6px] border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-2.5 text-[12px] font-medium text-[#065F46]">
                {configMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="cfg-hourly-rate"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFA]"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-min-margin"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFA]"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-min-ram"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFA]"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-overhead"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                  className="genesis-input w-full font-mono disabled:bg-[#FAFAFA]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[12px] text-[#9C9C9C]">
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
    </div>
  );
}
