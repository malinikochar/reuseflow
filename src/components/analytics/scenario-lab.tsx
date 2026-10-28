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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs text-stone-700">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-800">
            <BarChart3 className="h-4 w-4 text-teal-800" aria-hidden="true" />
            Active Rule Assumptions (v{engineConfig.ruleVersion}):
          </span>
          <span className="rounded bg-stone-100 px-2 py-1 border border-stone-200">
            Labor Rate: <strong>{formatCents(engineConfig.hourlyRateCents)}/hr</strong>
          </span>
          <span className="rounded bg-stone-100 px-2 py-1 border border-stone-200">
            Min Refurb Margin: <strong>{formatCents(engineConfig.minMarginCents)}</strong>
          </span>
          <span className="rounded bg-stone-100 px-2 py-1 border border-stone-200">
            Min Laptop RAM: <strong>{engineConfig.minLaptopRamGb} GB</strong>
          </span>
          <span className="rounded bg-stone-100 px-2 py-1 border border-stone-200">
            Overhead: <strong>{formatCents(engineConfig.overheadCents)}</strong>
          </span>
        </div>
        <span className="text-stone-500 italic">
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
        className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden"
      >
        <div className="border-b border-stone-200 bg-stone-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Calculator className="h-4 w-4 text-teal-800" aria-hidden="true" />
              <h3 className="text-base font-bold text-stone-950">
                Scenario Lab — Hypothetical Triage Capacity Calculator
              </h3>
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
                Illustrative scenario · not measured organizational performance
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-600">
              Inputs can be edited; estimates depend on assumptions. Labor value represents hypothetical bench capacity, not necessarily cash savings or incremental revenue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetScenario}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset to Seed (100 devices / $200)
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
                <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1.5">
                  <label htmlFor="scenario-devices-month">Monthly Device Volume</label>
                  <span className="font-mono text-teal-900">
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
                  className="w-full accent-teal-800 cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
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
                    className="w-24 rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-900"
                  />
                  <span className="text-[11px] text-stone-500">Seed default: 100/mo</span>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
                <div className="flex justify-between text-xs font-semibold text-stone-800 mb-1.5">
                  <label htmlFor="scenario-hourly-rate">Loaded Labor Rate ($/hr)</label>
                  <span className="font-mono text-teal-900">
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
                  className="w-full accent-teal-800 cursor-pointer"
                />
                <div className="mt-2 flex items-center gap-2">
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
                    className="w-24 rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-900"
                  />
                  <span className="text-[11px] text-stone-500">Seed default: $20/hr</span>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
                <label
                  htmlFor="scenario-baseline-mins"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900"
                />
                <span className="mt-1 block text-[11px] text-stone-500">
                  Hypothetical manual baseline (Seed: 12 min)
                </span>
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
                <label
                  htmlFor="scenario-proposed-mins"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900"
                />
                <span className="mt-1 block text-[11px] text-stone-500">
                  Hypothetical structured intake target (Seed: 6 min)
                </span>
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
                <label
                  htmlFor="scenario-impl-cost"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900"
                />
                <span className="mt-1 block text-[11px] text-stone-500">
                  Enter pilot training/setup cost for realistic payback
                </span>
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5">
                <label
                  htmlFor="scenario-monthly-software"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900"
                />
                <span className="mt-1 block text-[11px] text-stone-500">
                  Subtracted from monthly labor capacity value
                </span>
              </div>
            </div>
          </div>

          {/* Live Calculated Outputs */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-teal-900/20 bg-teal-950/5 p-5 space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-950">
                Live Scenario Arithmetic Output
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white border border-stone-200 p-3">
                  <p className="text-xs text-stone-500">Minutes Saved / Device</p>
                  <p className="mt-1 text-xl font-bold text-stone-900">
                    {output.minutesSavedPerDevice} min
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-stone-200 p-3">
                  <p className="text-xs text-stone-500">Monthly Hours Reallocated</p>
                  <p className="mt-1 text-xl font-bold text-teal-900">
                    {output.monthlyHoursSaved} hrs/mo
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-stone-200 p-3">
                  <p className="text-xs text-stone-500">Hypothetical Labor Value</p>
                  <p className="mt-1 text-xl font-bold text-stone-900">
                    {formatCents(output.monthlyLaborValueCents)}/mo
                  </p>
                </div>
                <div className="rounded-lg bg-white border border-stone-200 p-3">
                  <p className="text-xs text-stone-500">Net Monthly Capacity Value</p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      output.monthlyNetValueCents >= 0
                        ? 'text-emerald-800'
                        : 'text-red-700'
                    }`}
                  >
                    {formatCents(output.monthlyNetValueCents)}/mo
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white border border-stone-200 p-3">
                <p className="text-xs text-stone-500">Simple Payback Estimate</p>
                <p className="mt-1 text-sm font-bold text-stone-900">
                  {output.paybackLabel}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-800 shrink-0" aria-hidden="true" />
                Honest Claim Discipline
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900">
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
          className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden"
        >
          <div className="border-b border-stone-200 bg-stone-50 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-teal-800" aria-hidden="true" />
              <h3 className="text-sm font-bold text-stone-950">
                Configurable Decision Engine Thresholds (v1.0.0 Assumptions)
              </h3>
            </div>
            <span className="text-xs text-stone-500">Manager-only configuration</span>
          </div>

          <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
            {configMsg && (
              <div className="rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-950">
                {configMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="cfg-hourly-rate"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900 disabled:bg-stone-100"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-min-margin"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900 disabled:bg-stone-100"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-min-ram"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900 disabled:bg-stone-100"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-overhead"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900 disabled:bg-stone-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-stone-500">
                Updating thresholds applies to new assessments while preserving historic assessment snapshots.
              </p>
              <button
                type="submit"
                disabled={actorRole !== 'manager'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
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
