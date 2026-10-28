'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Edit3, Sparkles, X } from 'lucide-react';
import {
  BatterySafety,
  Condition,
  Device,
  UserRole,
} from '@/types/domain';
import { DeviceUpdateIntakeInput } from '@/lib/validation/schemas';

export function DeviceIntakeQuickEdit({
  device,
  actorRole,
  isBusy,
  defaultOpen = false,
  onSaveAndReassess,
}: {
  device: Device;
  actorRole: UserRole;
  isBusy: boolean;
  defaultOpen?: boolean;
  onSaveAndReassess: (
    updates: DeviceUpdateIntakeInput
  ) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const [ramGb, setRamGb] = useState<string>(
    device.ramGb !== null ? String(device.ramGb) : ''
  );
  const [storagePresent, setStoragePresent] = useState<boolean>(
    device.storagePresent
  );
  const [storageGb, setStorageGb] = useState<string>(
    device.storageGb !== null ? String(device.storageGb) : ''
  );
  const [chargerIncluded, setChargerIncluded] = useState<boolean>(
    Boolean(device.chargerIncluded)
  );
  const [boots, setBoots] = useState<'true' | 'false' | 'unknown'>(
    device.boots === null ? 'unknown' : device.boots ? 'true' : 'false'
  );
  const [repairable, setRepairable] = useState<'true' | 'false' | 'unknown'>(
    device.repairable === null ? 'unknown' : device.repairable ? 'true' : 'false'
  );
  const [condition, setCondition] = useState<Condition>(device.condition);
  const [batterySafety, setBatterySafety] = useState<BatterySafety>(
    device.batterySafety
  );
  const [partsDollars, setPartsDollars] = useState<string>(
    device.partsCostCents !== null ? (device.partsCostCents / 100).toFixed(2) : ''
  );
  const [laborMinutes, setLaborMinutes] = useState<string>(
    device.estimatedLaborMinutes !== null ? String(device.estimatedLaborMinutes) : ''
  );
  const [compDollars, setCompDollars] = useState<string>(
    device.comparableValueCents !== null
      ? (device.comparableValueCents / 100).toFixed(2)
      : ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setRamGb(device.ramGb !== null ? String(device.ramGb) : '');
    setStoragePresent(device.storagePresent);
    setStorageGb(device.storageGb !== null ? String(device.storageGb) : '');
    setChargerIncluded(Boolean(device.chargerIncluded));
    setBoots(device.boots === null ? 'unknown' : device.boots ? 'true' : 'false');
    setRepairable(
      device.repairable === null ? 'unknown' : device.repairable ? 'true' : 'false'
    );
    setCondition(device.condition);
    setBatterySafety(device.batterySafety);
    setPartsDollars(
      device.partsCostCents !== null ? (device.partsCostCents / 100).toFixed(2) : ''
    );
    setLaborMinutes(
      device.estimatedLaborMinutes !== null
        ? String(device.estimatedLaborMinutes)
        : ''
    );
    setCompDollars(
      device.comparableValueCents !== null
        ? (device.comparableValueCents / 100).toFixed(2)
        : ''
    );
    setErrorMsg(null);
    setIsOpen(defaultOpen);
  }, [device, defaultOpen]);

  const canEdit =
    actorRole === 'manager' ||
    (actorRole === 'technician' &&
      (device.status === 'intake' || device.status === 'assessed'));

  const hasMissingCritical =
    device.latestAssessment?.decision === 'INSUFFICIENT_DATA' ||
    (device.latestAssessment?.missingFields.length ?? 0) > 0;

  if (!canEdit) {
    return null;
  }

  const safeParseCents = (raw: string, fieldLabel: string): { ok: true; value: number | null } | { ok: false; error: string } => {
    const trimmed = raw.trim();
    if (trimmed === '') return { ok: true, value: null };
    const parsed = Number.parseFloat(trimmed);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 10000) {
      return {
        ok: false,
        error: `${fieldLabel} must be a valid amount between $0.00 and $10,000.00.`,
      };
    }
    return { ok: true, value: Math.round(parsed * 100) };
  };

  const safeParseInt = (
    raw: string,
    fieldLabel: string,
    maxVal: number
  ): { ok: true; value: number | null } | { ok: false; error: string } => {
    const trimmed = raw.trim();
    if (trimmed === '') return { ok: true, value: null };
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > maxVal) {
      return {
        ok: false,
        error: `${fieldLabel} must be a whole number between 0 and ${maxVal}.`,
      };
    }
    return { ok: true, value: parsed };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const partsCheck = safeParseCents(partsDollars, 'Parts Cost');
    if (!partsCheck.ok) {
      setErrorMsg(partsCheck.error);
      return;
    }

    const compCheck = safeParseCents(compDollars, 'Comparable Value');
    if (!compCheck.ok) {
      setErrorMsg(compCheck.error);
      return;
    }

    const laborCheck = safeParseInt(laborMinutes, 'Estimated Labor Minutes', 2000);
    if (!laborCheck.ok) {
      setErrorMsg(laborCheck.error);
      return;
    }

    const ramCheck = safeParseInt(ramGb, 'RAM (GB)', 1024);
    if (!ramCheck.ok) {
      setErrorMsg(ramCheck.error);
      return;
    }

    const storageCheck = storagePresent
      ? safeParseInt(storageGb, 'Storage Capacity (GB)', 32768)
      : { ok: true as const, value: null };
    if (!storageCheck.ok) {
      setErrorMsg(storageCheck.error);
      return;
    }

    const res = await onSaveAndReassess({
      id: device.id,
      ramGb: ramCheck.value,
      storagePresent,
      storageGb: storageCheck.value,
      chargerIncluded,
      boots: boots === 'unknown' ? null : boots === 'true',
      repairable: repairable === 'unknown' ? null : repairable === 'true',
      condition,
      batterySafety,
      partsCostCents: partsCheck.value,
      estimatedLaborMinutes: laborCheck.value,
      comparableValueCents: compCheck.value,
    });

    if (res.ok) {
      setIsOpen(false);
    } else {
      setErrorMsg(res.message ?? 'Could not save intake updates.');
    }
  };

  return (
    <div className="no-print">
      {!isOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-3 genesis-panel bg-[#FAFAFA] px-4 py-3">
          <div className="flex items-center gap-2 text-[13px]">
            <Edit3 className="h-4 w-4 text-[#6366F1] shrink-0" aria-hidden="true" />
            <span className="text-[#6B6B6B]">
              {hasMissingCritical ? (
                <>
                  <strong className="text-[#0A0A0A]">Missing Intake Fields Detected:</strong>{' '}
                  Complete missing cost/condition specs to unlock full v1.0.0 economic evaluation.
                </>
              ) : (
                <>
                  Need to adjust bench diagnostic specs (RAM, storage, parts cost, labor minutes, or comparable value) and re-score?
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={
              hasMissingCritical
                ? 'genesis-btn-primary min-h-[40px] px-4 py-2 text-[12px] inline-flex items-center gap-1.5 cursor-pointer'
                : 'genesis-btn-secondary min-h-[40px] px-3.5 py-1.5 text-[12px] inline-flex items-center gap-1.5 cursor-pointer'
            }
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            {hasMissingCritical
              ? 'Complete Missing Intake Specs'
              : 'Edit Intake Specs & Re-Score'}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          aria-label="Edit Device Intake Specifications"
          className="genesis-card p-5 space-y-4 border-[#6366F1]/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E8EC] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              <h3 className="font-display text-[16px] font-bold text-[#0A0A0A]">
                Update Bench Intake Specs & Re-Run v1.0.0 Engine ({device.assetTag})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {hasMissingCritical && (
                <button
                  type="button"
                  onClick={() => setCompDollars('110.00')}
                  className="genesis-btn-secondary px-2.5 py-1 text-[11px] font-mono cursor-pointer"
                >
                  Quick Fill $110.00 Comp Value
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#6B6B6B] hover:text-[#0A0A0A] p-1 cursor-pointer"
                aria-label="Close spec editor"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-[6px] border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-[12px] font-medium text-[#991B1B]"
            >
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="quick-edit-comp"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Comparable Value ($ USD)
              </label>
              <input
                id="quick-edit-comp"
                type="number"
                step="0.01"
                min="0"
                max="10000"
                value={compDollars}
                onChange={(e) => setCompDollars(e.target.value)}
                placeholder="e.g. 110.00"
                className="genesis-input w-full min-h-[40px]"
              />
            </div>

            <div>
              <label
                htmlFor="quick-edit-parts"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Parts Cost ($ USD)
              </label>
              <input
                id="quick-edit-parts"
                type="number"
                step="0.01"
                min="0"
                max="10000"
                value={partsDollars}
                onChange={(e) => setPartsDollars(e.target.value)}
                placeholder="e.g. 15.00"
                className="genesis-input w-full min-h-[40px]"
              />
            </div>

            <div>
              <label
                htmlFor="quick-edit-labor"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Estimated Labor (Minutes)
              </label>
              <input
                id="quick-edit-labor"
                type="number"
                step="1"
                min="0"
                max="2000"
                value={laborMinutes}
                onChange={(e) => setLaborMinutes(e.target.value)}
                placeholder="e.g. 30"
                className="genesis-input w-full min-h-[40px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="quick-edit-ram"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                RAM (GB)
              </label>
              <input
                id="quick-edit-ram"
                type="number"
                min="0"
                max="1024"
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                className="genesis-input w-full min-h-[40px]"
              />
            </div>

            <div>
              <label
                htmlFor="quick-edit-storage-present"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Storage Drive Present
              </label>
              <select
                id="quick-edit-storage-present"
                value={storagePresent ? 'yes' : 'no'}
                onChange={(e) => {
                  const present = e.target.value === 'yes';
                  setStoragePresent(present);
                  if (!present) setStorageGb('');
                }}
                className="genesis-input w-full min-h-[40px]"
              >
                <option value="yes">Yes (Drive Installed)</option>
                <option value="no">No Drive</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quick-edit-storage-gb"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Storage Capacity (GB)
              </label>
              <input
                id="quick-edit-storage-gb"
                type="number"
                min="0"
                max="32768"
                disabled={!storagePresent}
                value={storagePresent ? storageGb : ''}
                onChange={(e) => setStorageGb(e.target.value)}
                placeholder={storagePresent ? '256' : 'N/A'}
                className="genesis-input w-full min-h-[40px] disabled:bg-[#FAFAFA] disabled:text-[#9C9C9C]"
              />
            </div>

            <div>
              <label
                htmlFor="quick-edit-charger"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Power Adapter / Charger
              </label>
              <select
                id="quick-edit-charger"
                value={chargerIncluded ? 'yes' : 'no'}
                onChange={(e) => setChargerIncluded(e.target.value === 'yes')}
                className="genesis-input w-full min-h-[40px]"
              >
                <option value="yes">Included</option>
                <option value="no">Missing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="quick-edit-boots"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Boots to BIOS/OS
              </label>
              <select
                id="quick-edit-boots"
                value={boots}
                onChange={(e) =>
                  setBoots(e.target.value as 'true' | 'false' | 'unknown')
                }
                className="genesis-input w-full min-h-[40px]"
              >
                <option value="true">Yes (Boots)</option>
                <option value="false">No (Does Not Boot)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quick-edit-repairable"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Repairable
              </label>
              <select
                id="quick-edit-repairable"
                value={repairable}
                onChange={(e) =>
                  setRepairable(e.target.value as 'true' | 'false' | 'unknown')
                }
                className="genesis-input w-full min-h-[40px]"
              >
                <option value="true">Yes (Repairable)</option>
                <option value="false">No (Unrepairable)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quick-edit-condition"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Condition
              </label>
              <select
                id="quick-edit-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="genesis-input w-full min-h-[40px]"
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quick-edit-battery"
                className="block text-[12px] font-medium text-[#0A0A0A] mb-1"
              >
                Battery Safety
              </label>
              <select
                id="quick-edit-battery"
                value={batterySafety}
                onChange={(e) => setBatterySafety(e.target.value as BatterySafety)}
                className="genesis-input w-full min-h-[40px]"
              >
                <option value="normal">Normal</option>
                <option value="degraded">Degraded</option>
                <option value="swollen">Swollen (Hazard)</option>
                <option value="unknown">Unknown</option>
                <option value="not_applicable">N/A (Desktop)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8EC]">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="genesis-btn-secondary min-h-[40px] px-4 py-2 text-[13px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="genesis-btn-primary min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-[13px] cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {isBusy ? 'Saving & Evaluating...' : 'Save Specs & Re-Evaluate v1.0.0'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
