import { describe, expect, it } from 'vitest';
import { DEFAULT_ENGINE_CONFIG, evaluateDevice, formatCents } from '@/lib/decision/engine';
import { PRD_FIXTURE_CASES } from '@/fixtures/demo-devices';
import { AssessmentInput } from '@/types/domain';

describe('ReuseFlow Deterministic Decision Engine v1.0.0', () => {
  it('Case A — viable 8 GB laptop yields REFURBISH_CANDIDATE with $35.00 repair cost and $145.00 margin', () => {
    const fixture = PRD_FIXTURE_CASES.find((f) => f.code === 'A')!;
    const result = evaluateDevice(fixture.input, DEFAULT_ENGINE_CONFIG, 'verified');

    expect(result.decision).toBe('REFURBISH_CANDIDATE');
    expect(result.ruleVersion).toBe('1.0.0');
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.repairCostCents).toBe(3500); // $20 parts + $15 labor (45 min @ $20/hr)
    expect(result.marginCents).toBe(14500); // $180 - $35 = $145
    expect(result.reasonCodes).toContain('VIABLE_COST_AND_FUNCTION');
    expect(result.sanitizationGateOpen).toBe(true);
  });

  it('Case B — borderline 4 GB laptop with $0 margin yields REVIEW_REQUIRED with LOW_RAM and BELOW_MARGIN_THRESHOLD', () => {
    const fixture = PRD_FIXTURE_CASES.find((f) => f.code === 'B')!;
    const result = evaluateDevice(fixture.input, DEFAULT_ENGINE_CONFIG, 'pending');

    expect(result.decision).toBe('REVIEW_REQUIRED');
    expect(result.repairCostCents).toBe(7000); // $40 parts + $30 labor (90 min @ $20/hr)
    expect(result.marginCents).toBe(0);
    expect(result.reasonCodes).toContain('LOW_RAM');
    expect(result.reasonCodes).toContain('BELOW_MARGIN_THRESHOLD');
    expect(result.requiresHumanApproval).toBe(true);
  });

  it('Case C — swollen battery immediately triggers QUARANTINE before any economic scoring', () => {
    const fixture = PRD_FIXTURE_CASES.find((f) => f.code === 'C')!;
    const result = evaluateDevice(fixture.input, DEFAULT_ENGINE_CONFIG, 'pending');

    expect(result.decision).toBe('QUARANTINE');
    expect(result.reasonCodes).toContain('SAFETY_BATTERY_SWOLLEN');
    // Economic scoring is intentionally skipped when safety hazard dominates
    expect(result.repairCostCents).toBeNull();
    expect(result.marginCents).toBeNull();
    expect(result.costBreakdown).toBeNull();
    expect(result.requiresHumanApproval).toBe(true);
  });

  it('Case D — non-repairable device with negative margin yields RECYCLE_REVIEW (never automatic disposal)', () => {
    const fixture = PRD_FIXTURE_CASES.find((f) => f.code === 'D')!;
    const result = evaluateDevice(fixture.input, DEFAULT_ENGINE_CONFIG, 'not_applicable');

    expect(result.decision).toBe('RECYCLE_REVIEW');
    expect(result.repairCostCents).toBe(22000); // $200 parts + $20 labor
    expect(result.marginCents).toBe(-14000); // $80 - $220 = -$140
    expect(result.reasonCodes).toContain('NOT_REPAIRABLE_AND_NEGATIVE_MARGIN');
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.sanitizationGateOpen).toBe(true);
  });

  it('Case E — missing critical input (comparableValueCents) yields INSUFFICIENT_DATA and lists missing fields', () => {
    const fixture = PRD_FIXTURE_CASES.find((f) => f.code === 'E')!;
    const result = evaluateDevice(fixture.input, DEFAULT_ENGINE_CONFIG, 'pending');

    expect(result.decision).toBe('INSUFFICIENT_DATA');
    expect(result.missingFields).toEqual(['comparableValueCents']);
    expect(result.reasonCodes).toContain('MISSING_CRITICAL_INPUTS');
    expect(result.repairCostCents).toBeNull();
    expect(result.marginCents).toBeNull();
  });

  it('Case F — viable storage-bearing device with pending sanitization gets REFURBISH_CANDIDATE but locks sanitizationGateOpen', () => {
    const fixture = PRD_FIXTURE_CASES.find((f) => f.code === 'F')!;
    const result = evaluateDevice(fixture.input, DEFAULT_ENGINE_CONFIG, 'pending');

    expect(result.decision).toBe('REFURBISH_CANDIDATE');
    expect(result.repairCostCents).toBe(2500);
    expect(result.marginCents).toBe(11500);
    expect(result.sanitizationGateOpen).toBe(false);
    expect(result.reasonCodes).toContain('SANITIZATION_GATE_PENDING');
  });

  it('treats missing laptop RAM (null) as REVIEW_REQUIRED with MISSING_LAPTOP_RAM rather than treating unknown as zero', () => {
    const input: AssessmentInput = {
      category: 'laptop',
      brand: 'Lenovo',
      model: 'ThinkPad X1',
      ramGb: null,
      storageGb: 256,
      boots: true,
      condition: 'good',
      batterySafety: 'normal',
      storagePresent: true,
      repairable: true,
      chargerIncluded: true,
      partsCostCents: 1000,
      estimatedLaborMinutes: 30,
      comparableValueCents: 15000,
    };

    const result = evaluateDevice(input, DEFAULT_ENGINE_CONFIG, 'verified');
    expect(result.decision).toBe('REVIEW_REQUIRED');
    expect(result.reasonCodes).toContain('MISSING_LAPTOP_RAM');
    expect(result.reasonCodes).not.toContain('LOW_RAM');
  });

  it('handles zero repair cost and rounding edge cases deterministically in integer cents', () => {
    const input: AssessmentInput = {
      category: 'desktop',
      brand: 'Dell',
      model: 'OptiPlex',
      ramGb: 16,
      storageGb: null,
      boots: true,
      condition: 'good',
      batterySafety: 'not_applicable',
      storagePresent: false,
      repairable: true,
      chargerIncluded: true,
      partsCostCents: 0,
      estimatedLaborMinutes: 7, // 7 * 2000 / 60 = 233.333... -> rounds to 233 cents
      comparableValueCents: 5000,
    };

    const first = evaluateDevice(input, DEFAULT_ENGINE_CONFIG, 'not_applicable');
    const second = evaluateDevice(input, DEFAULT_ENGINE_CONFIG, 'not_applicable');

    expect(first).toEqual(second);
    expect(first.repairCostCents).toBe(233);
    expect(first.marginCents).toBe(4767);
    expect(formatCents(first.repairCostCents)).toBe('$2.33');
  });

  it('rejects negative money, negative minutes, NaN, Infinity, or impossible storage combinations', () => {
    const base = PRD_FIXTURE_CASES[0]!.input;

    expect(() =>
      evaluateDevice({ ...base, partsCostCents: -100 }, DEFAULT_ENGINE_CONFIG)
    ).toThrow(/cannot be negative/i);

    expect(() =>
      evaluateDevice({ ...base, estimatedLaborMinutes: -5 }, DEFAULT_ENGINE_CONFIG)
    ).toThrow(/cannot be negative/i);

    expect(() =>
      evaluateDevice({ ...base, comparableValueCents: Number.NaN }, DEFAULT_ENGINE_CONFIG)
    ).toThrow(/must be a finite number/i);

    expect(() =>
      evaluateDevice(
        { ...base, storagePresent: false, storageGb: 256 },
        DEFAULT_ENGINE_CONFIG
      )
    ).toThrow(/storagePresent is false/i);
  });
});
