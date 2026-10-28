import { ScenarioInput, ScenarioOutput } from '@/types/domain';
import { scenarioInputSchema } from '@/lib/validation/schemas';

/**
 * Seed hypothetical scenario from ReuseFlow_PRD.md §10:
 * 100 devices/month, 12 min baseline vs. 6 min target, $20/hour labor,
 * $0 software and implementation costs for isolated arithmetic demonstration only.
 */
export const DEFAULT_SCENARIO_INPUT: ScenarioInput = {
  devicesPerMonth: 100,
  baselineMinutesPerDevice: 12,
  proposedMinutesPerDevice: 6,
  hourlyLaborRateCents: 2000, // $20.00/hr
  implementationCostCents: 0,
  monthlySoftwareCostCents: 0,
};

/**
 * Pure Scenario Lab impact arithmetic (ReuseFlow_PRD.md §10).
 * Explicitly computes hypothetical labor capacity value — NOT audited cash savings.
 */
export function calculateScenarioImpact(rawInput: ScenarioInput): ScenarioOutput {
  const parsed = scenarioInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Invalid ScenarioInput: ${messages}`);
  }

  const input = parsed.data;
  const minutesSavedPerDevice = Math.max(
    0,
    input.baselineMinutesPerDevice - input.proposedMinutesPerDevice
  );
  const monthlyHoursSaved =
    Math.round(((input.devicesPerMonth * minutesSavedPerDevice) / 60) * 100) / 100;

  // Compute monthly labor value in integer cents directly from minutes to avoid floating-point drift
  const totalMinutesSavedPerMonth = input.devicesPerMonth * minutesSavedPerDevice;
  const monthlyLaborValueCents = Math.round(
    (totalMinutesSavedPerMonth * input.hourlyLaborRateCents) / 60
  );
  const monthlyNetValueCents = monthlyLaborValueCents - input.monthlySoftwareCostCents;

  let simplePaybackMonths: number | null = null;
  let paybackLabel = 'No payback under these assumptions';

  if (input.implementationCostCents === 0 && monthlyNetValueCents > 0) {
    simplePaybackMonths = 0;
    paybackLabel = 'Immediate ($0 implementation assumption — add realistic pilot costs to estimate payback)';
  } else if (monthlyNetValueCents > 0) {
    simplePaybackMonths =
      Math.round((input.implementationCostCents / monthlyNetValueCents) * 10) / 10;
    paybackLabel = `${simplePaybackMonths.toFixed(1)} months (hypothetical)`;
  }

  return {
    minutesSavedPerDevice,
    monthlyHoursSaved,
    monthlyLaborValueCents,
    monthlyNetValueCents,
    simplePaybackMonths,
    paybackLabel,
  };
}
