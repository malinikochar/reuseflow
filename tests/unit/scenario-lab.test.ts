import { describe, expect, it } from 'vitest';
import { calculateScenarioImpact, DEFAULT_SCENARIO_INPUT } from '@/lib/decision/scenario';

describe('Scenario Lab Hypothetical Impact Calculator', () => {
  it('computes the exact PRD seed scenario (100 devices, 12m vs 6m, $20/hr, $0 software/impl -> 10 hrs, $200/mo)', () => {
    const output = calculateScenarioImpact(DEFAULT_SCENARIO_INPUT);

    expect(output.minutesSavedPerDevice).toBe(6);
    expect(output.monthlyHoursSaved).toBe(10);
    expect(output.monthlyLaborValueCents).toBe(20000); // $200.00
    expect(output.monthlyNetValueCents).toBe(20000);
    expect(output.simplePaybackMonths).toBe(0);
    expect(output.paybackLabel).toContain('Immediate ($0 implementation assumption');
  });

  it('computes realistic payback period when implementation and monthly software costs are included', () => {
    const output = calculateScenarioImpact({
      devicesPerMonth: 150,
      baselineMinutesPerDevice: 14,
      proposedMinutesPerDevice: 6, // 8 min saved/device -> 1200 min = 20 hrs/month
      hourlyLaborRateCents: 2200, // $22/hr -> $440/month labor capacity value
      implementationCostCents: 120000, // $1,200 setup
      monthlySoftwareCostCents: 4000, // $40/month hosting -> $400/month net
    });

    expect(output.minutesSavedPerDevice).toBe(8);
    expect(output.monthlyHoursSaved).toBe(20);
    expect(output.monthlyLaborValueCents).toBe(44000);
    expect(output.monthlyNetValueCents).toBe(40000);
    expect(output.simplePaybackMonths).toBe(3); // $1,200 / $400 = 3.0 months
  });

  it('never produces negative minutes saved or divide-by-zero when net value is zero or negative', () => {
    const output = calculateScenarioImpact({
      devicesPerMonth: 50,
      baselineMinutesPerDevice: 5,
      proposedMinutesPerDevice: 10, // proposed slower than baseline -> 0 min saved
      hourlyLaborRateCents: 2000,
      implementationCostCents: 50000,
      monthlySoftwareCostCents: 2500,
    });

    expect(output.minutesSavedPerDevice).toBe(0);
    expect(output.monthlyHoursSaved).toBe(0);
    expect(output.monthlyLaborValueCents).toBe(0);
    expect(output.monthlyNetValueCents).toBe(-2500);
    expect(output.simplePaybackMonths).toBeNull();
    expect(output.paybackLabel).toBe('No payback under these assumptions');
  });
});
