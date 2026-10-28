'use client';

import React, { useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import {
  BatterySafety,
  Condition,
  DeviceCategory,
  EngineConfig,
} from '@/types/domain';
import { DeviceCreateInput } from '@/lib/validation/schemas';
import { PRD_FIXTURE_CASES } from '@/fixtures/demo-devices';
import { DEFAULT_ENGINE_CONFIG, evaluateDevice, formatCents } from '@/lib/decision/engine';
import { DecisionBadge } from '@/components/shared/badges-and-banners';

export function DeviceIntakeForm({
  onSubmit,
  onCancel,
  engineConfig = DEFAULT_ENGINE_CONFIG,
  isSubmitting = false,
}: {
  onSubmit: (input: DeviceCreateInput) => Promise<{ ok: boolean; message?: string }>;
  onCancel?: () => void;
  engineConfig?: EngineConfig;
  isSubmitting?: boolean;
}) {
  const [assetTag, setAssetTag] = useState(() => `FG-INT-${Math.floor(200 + Math.random() * 799)}`);
  const [category, setCategory] = useState<DeviceCategory>('laptop');
  const [brand, setBrand] = useState('Lenovo');
  const [model, setModel] = useState('ThinkPad T480');
  const [ramGb, setRamGb] = useState<string>('8');
  const [storageGb, setStorageGb] = useState<string>('256');
  const [boots, setBoots] = useState<'true' | 'false' | 'unknown'>('true');
  const [condition, setCondition] = useState<Condition>('good');
  const [batterySafety, setBatterySafety] = useState<BatterySafety>('normal');
  const [storagePresent, setStoragePresent] = useState<boolean>(true);
  const [repairable, setRepairable] = useState<'true' | 'false' | 'unknown'>('true');
  const [chargerIncluded, setChargerIncluded] = useState<boolean>(true);
  const [partsDollars, setPartsDollars] = useState<string>('20');
  const [laborMinutes, setLaborMinutes] = useState<string>('45');
  const [comparableDollars, setComparableDollars] = useState<string>('180');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyPreset = (code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => {
    const preset = PRD_FIXTURE_CASES.find((f) => f.code === code);
    if (!preset) return;

    const suffix = Math.floor(100 + Math.random() * 899);
    setAssetTag(`FG-CASE-${code}-${suffix}`);
    setCategory(preset.input.category);
    setBrand(preset.input.brand ?? 'Generic');
    setModel(preset.input.model ?? 'Sample Device');
    setRamGb(preset.input.ramGb !== null && preset.input.ramGb !== undefined ? String(preset.input.ramGb) : '');
    setStorageGb(
      preset.input.storageGb !== null && preset.input.storageGb !== undefined
        ? String(preset.input.storageGb)
        : ''
    );
    setBoots(
      preset.input.boots === true ? 'true' : preset.input.boots === false ? 'false' : 'unknown'
    );
    setCondition(preset.input.condition);
    setBatterySafety(preset.input.batterySafety);
    setStoragePresent(preset.input.storagePresent);
    setRepairable(
      preset.input.repairable === true
        ? 'true'
        : preset.input.repairable === false
          ? 'false'
          : 'unknown'
    );
    setChargerIncluded(Boolean(preset.input.chargerIncluded));
    setPartsDollars(
      preset.input.partsCostCents !== null && preset.input.partsCostCents !== undefined
        ? String(preset.input.partsCostCents / 100)
        : ''
    );
    setLaborMinutes(
      preset.input.estimatedLaborMinutes !== null &&
        preset.input.estimatedLaborMinutes !== undefined
        ? String(preset.input.estimatedLaborMinutes)
        : ''
    );
    setComparableDollars(
      preset.input.comparableValueCents !== null &&
        preset.input.comparableValueCents !== undefined
        ? String(preset.input.comparableValueCents / 100)
        : ''
    );
    setErrorMessage(null);
  };

  const handleCategoryChange = (nextCategory: DeviceCategory) => {
    setCategory(nextCategory);
    if (nextCategory === 'desktop') {
      setBatterySafety('not_applicable');
    } else if (batterySafety === 'not_applicable') {
      setBatterySafety('normal');
    }
  };

  const buildPayload = (): DeviceCreateInput => {
    const parseNullableInt = (raw: string): number | null => {
      if (raw.trim() === '') return null;
      const n = Number.parseInt(raw, 10);
      return Number.isNaN(n) ? null : n;
    };

    const parseNullableCents = (raw: string): number | null => {
      if (raw.trim() === '') return null;
      const n = Number.parseFloat(raw);
      return Number.isNaN(n) ? null : Math.round(n * 100);
    };

    return {
      assetTag: assetTag.trim(),
      category,
      brand: brand.trim(),
      model: model.trim(),
      ramGb: parseNullableInt(ramGb),
      storageGb: storagePresent ? parseNullableInt(storageGb) : null,
      boots: boots === 'unknown' ? null : boots === 'true',
      condition,
      batterySafety,
      storagePresent,
      repairable: repairable === 'unknown' ? null : repairable === 'true',
      chargerIncluded,
      partsCostCents: parseNullableCents(partsDollars),
      estimatedLaborMinutes: parseNullableInt(laborMinutes),
      comparableValueCents: parseNullableCents(comparableDollars),
    };
  };

  // Compute live preview of engine result if inputs are valid
  let livePreview = null;
  try {
    const payload = buildPayload();
    livePreview = evaluateDevice(
      payload,
      engineConfig,
      payload.storagePresent ? 'pending' : 'not_applicable'
    );
  } catch {
    livePreview = null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = buildPayload();
    const res = await onSubmit(payload);
    if (!res.ok) {
      setErrorMessage(res.message ?? 'Validation failed. Please check highlighted fields.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden"
      noValidate
    >
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-950">
            New Donated Device Intake & Triage
          </h3>
          <p className="text-xs text-stone-600">
            Enter hardware condition, safety checks, and repair cost estimates. Never enter donor PII or real serial numbers.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close intake form"
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-800 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Quick Preset Bar for 90-second Judge Walkthrough */}
      <div className="border-b border-stone-200 bg-teal-950/5 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-950">
            <Sparkles className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
            Quick-Load PRD Fixture:
          </span>
          {PRD_FIXTURE_CASES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => applyPreset(f.code)}
              className="rounded-md border border-stone-300 bg-white hover:bg-teal-50 hover:border-teal-600 px-2.5 py-1 text-xs font-medium text-stone-800 transition-colors cursor-pointer"
              title={f.summary}
            >
              Case {f.code}: {f.title.replace(/^Case [A-F] — /, '')}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-3.5 text-sm text-red-900 font-medium"
          >
            {errorMessage}
          </div>
        )}

        {/* Section 1: Identification & Specs */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            1. Hardware Identification & Specs
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="intake-asset-tag"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Internal Asset Tag *
              </label>
              <input
                id="intake-asset-tag"
                type="text"
                required
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                placeholder="FG-DEMO-201"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="intake-category"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Device Category *
              </label>
              <select
                id="intake-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as DeviceCategory)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="intake-brand"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Brand *
              </label>
              <input
                id="intake-brand"
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Lenovo, Dell, HP..."
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="intake-model"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Model (No Serial Numbers) *
              </label>
              <input
                id="intake-model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ThinkPad T480"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="intake-ram"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                RAM (GB) <span className="font-normal text-stone-500">(blank if unknown)</span>
              </label>
              <input
                id="intake-ram"
                type="number"
                min="0"
                max="1024"
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                placeholder="8"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="intake-storage-present"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Storage Media Installed?
              </label>
              <select
                id="intake-storage-present"
                value={storagePresent ? 'yes' : 'no'}
                onChange={(e) => {
                  const present = e.target.value === 'yes';
                  setStoragePresent(present);
                  if (!present) setStorageGb('');
                }}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="yes">Yes — Drive Present (Requires Wipe Check)</option>
                <option value="no">No Drive Installed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="intake-storage-gb"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Storage Capacity (GB)
              </label>
              <input
                id="intake-storage-gb"
                type="number"
                min="0"
                max="32768"
                disabled={!storagePresent}
                value={storagePresent ? storageGb : ''}
                onChange={(e) => setStorageGb(e.target.value)}
                placeholder={storagePresent ? '256' : 'N/A (No drive)'}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 disabled:bg-stone-100 disabled:text-stone-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="intake-charger"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Power Adapter Included?
              </label>
              <select
                id="intake-charger"
                value={chargerIncluded ? 'yes' : 'no'}
                onChange={(e) => setChargerIncluded(e.target.value === 'yes')}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Safety & Functional Triage */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            2. Physical Safety & Functional Inspection
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="intake-battery-safety"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Battery Safety Check *
              </label>
              <select
                id="intake-battery-safety"
                value={batterySafety}
                onChange={(e) => setBatterySafety(e.target.value as BatterySafety)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 ${
                  batterySafety === 'swollen'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 focus:ring-amber-500'
                    : 'border-stone-300 bg-white text-stone-900 focus:border-teal-700 focus:ring-teal-600/20'
                }`}
              >
                <option value="normal">Normal (Safe)</option>
                <option value="degraded">Degraded (Holds low charge, not swollen)</option>
                <option value="swollen">SWOLLEN HAZARD (Immediate Quarantine)</option>
                <option value="unknown">Unknown / Untested</option>
                {category === 'desktop' && (
                  <option value="not_applicable">Not Applicable (Desktop)</option>
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="intake-condition"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Cosmetic / Chassis Condition *
              </label>
              <select
                id="intake-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="good">Good (Minor wear)</option>
                <option value="fair">Fair (Serviceable wear)</option>
                <option value="poor">Poor (Damaged housing/screen)</option>
                <option value="unknown">Unknown / Uninspected</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="intake-boots"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Powers On / Boots to POST?
              </label>
              <select
                id="intake-boots"
                value={boots}
                onChange={(e) => setBoots(e.target.value as 'true' | 'false' | 'unknown')}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="true">Yes — Boots cleanly</option>
                <option value="false">No — Fails to boot</option>
                <option value="unknown">Not yet tested (Missing input)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="intake-repairable"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Technically Repairable?
              </label>
              <select
                id="intake-repairable"
                value={repairable}
                onChange={(e) =>
                  setRepairable(e.target.value as 'true' | 'false' | 'unknown')
                }
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="true">Yes — Standard parts/service</option>
                <option value="false">No — Irreparable board/damage</option>
                <option value="unknown">Uncertain / Not yet assessed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Repair Economics Assumptions */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            3. Repair Cost & Manual Comparable Value Assumptions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="intake-parts-dollars"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Estimated Parts Cost ($ USD)
              </label>
              <input
                id="intake-parts-dollars"
                type="number"
                min="0"
                max="10000"
                step="0.01"
                value={partsDollars}
                onChange={(e) => setPartsDollars(e.target.value)}
                placeholder="20.00"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="intake-labor-minutes"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Estimated Bench Labor (Minutes)
              </label>
              <input
                id="intake-labor-minutes"
                type="number"
                min="0"
                max="2000"
                step="5"
                value={laborMinutes}
                onChange={(e) => setLaborMinutes(e.target.value)}
                placeholder="45"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="intake-comparable-dollars"
                className="block text-xs font-semibold text-stone-800 mb-1"
              >
                Manual Comparable Value ($ USD)
              </label>
              <input
                id="intake-comparable-dollars"
                type="number"
                min="0"
                max="10000"
                step="1"
                value={comparableDollars}
                onChange={(e) => setComparableDollars(e.target.value)}
                placeholder="180.00 (leave blank for Case E)"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          </div>
        </div>

        {/* Instant Live Preview Banner */}
        {livePreview && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-stone-600">
                Instant Engine Preview (v1.0.0):
              </span>
              <DecisionBadge decision={livePreview.decision} />
              {livePreview.repairCostCents !== null && (
                <span className="text-xs text-stone-700">
                  Est. Repair Cost: <strong>{formatCents(livePreview.repairCostCents)}</strong> ·
                  Net Margin: <strong>{formatCents(livePreview.marginCents)}</strong>
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-stone-500">
              Human manager approval still required
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-800 hover:bg-teal-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Saving & Evaluating...' : 'Save Device & Run Assessment'}
          </button>
        </div>
      </div>
    </form>
  );
}
