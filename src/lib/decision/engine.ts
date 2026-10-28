import {
  AssessmentInput,
  AssessmentResult,
  CostBreakdown,
  EngineConfig,
  ReasonCode,
  SanitizationStatus,
} from '@/types/domain';
import { assessmentInputSchema, engineConfigSchema } from '@/lib/validation/schemas';

/**
 * Default illustrative rule configuration v1.0.0 (ReuseFlow_PRD.md §6.2).
 * These thresholds are configurable product assumptions, NOT industry standards.
 */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  ruleVersion: '1.0.0',
  hourlyRateCents: 2000, // $20.00 / hour
  minMarginCents: 2000, // $20.00 minimum positive margin
  minLaptopRamGb: 8, // 8 GB heuristic for laptops
  overheadCents: 0, // $0.00 default overhead
  baselineMinutes: 12, // 12 min hypothetical manual triage baseline
  targetMinutes: 6, // 6 min hypothetical assisted triage target
};

export const REASON_CODE_LABELS: Record<ReasonCode, string> = {
  SAFETY_BATTERY_SWOLLEN:
    'Swollen battery detected: immediate safety quarantine required before any economic evaluation.',
  MISSING_CRITICAL_INPUTS:
    'Critical triage inputs are missing; economic viability cannot be computed until required fields are entered.',
  UNVERIFIED_CONDITION:
    'Physical condition is unknown; hands-on technician inspection is required before routing.',
  AMBIGUOUS_BATTERY_SAFETY:
    'Battery safety status is unknown on a portable device; verify battery integrity before proceeding.',
  NOT_REPAIRABLE_AND_NEGATIVE_MARGIN:
    'Device is marked non-repairable and estimated repair cost exceeds comparable value; routed for human recycle review.',
  VIABLE_COST_AND_FUNCTION:
    'Device boots, is repairable, meets RAM heuristics, and clears the minimum positive margin threshold.',
  BELOW_MARGIN_THRESHOLD:
    'Estimated net margin falls below the configured minimum margin threshold for high-priority refurbishment.',
  LOW_RAM:
    'Laptop RAM is below the configured minimum RAM threshold; requires manager review for upgrade or alternative use.',
  MISSING_LAPTOP_RAM:
    'Laptop RAM capacity was not recorded; unknown RAM is never treated as zero and requires technician verification.',
  BOOT_FAILURE:
    'Device does not currently boot; requires diagnostic bench review before approving refurbishment.',
  REPAIRABILITY_UNCERTAIN:
    'Device is marked not repairable; requires manager review before committing parts or labor.',
  POOR_PHYSICAL_CONDITION:
    'Physical condition is graded poor; verify chassis/screen usability before final refurbishment approval.',
  BATTERY_DEGRADED_NEEDS_CHECK:
    'Battery is degraded (though not swollen); confirm replacement battery cost is included in parts estimate.',
  SANITIZATION_GATE_PENDING:
    'Storage media is present and external sanitization has not yet been verified; ready/closed disposition gate remains locked.',
};

export function formatCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return '—';
  }
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const dollars = (abs / 100).toFixed(2);
  return `${sign}$${dollars}`;
}

/**
 * Pure, deterministic refurbishment assessment engine v1.0.0.
 * Never performs external calls, never mutates inputs, and always uses integer cents.
 */
export function evaluateDevice(
  rawInput: AssessmentInput,
  rawConfig: EngineConfig = DEFAULT_ENGINE_CONFIG,
  currentSanitizationStatus: SanitizationStatus = 'pending'
): AssessmentResult {
  // 1. Validate enums, ranges, and impossible combinations
  const parsedInput = assessmentInputSchema.safeParse(rawInput);
  if (!parsedInput.success) {
    const messages = parsedInput.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Invalid AssessmentInput: ${messages}`);
  }

  const parsedConfig = engineConfigSchema.safeParse(rawConfig);
  if (!parsedConfig.success) {
    const messages = parsedConfig.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Invalid EngineConfig: ${messages}`);
  }

  const input = parsedInput.data;
  const config = parsedConfig.data;

  // Gate 8 (evaluated continuously): sanitizationGateOpen is false if storagePresent=true and sanitization not verified
  const sanitizationGateOpen =
    !input.storagePresent || currentSanitizationStatus === 'verified';

  const appendSanitizationAdvisory = (
    codes: ReasonCode[],
    details: string[]
  ): { reasonCodes: ReasonCode[]; reasonDetails: string[] } => {
    const nextCodes = [...codes];
    const nextDetails = [...details];
    if (!sanitizationGateOpen && !nextCodes.includes('SANITIZATION_GATE_PENDING')) {
      nextCodes.push('SANITIZATION_GATE_PENDING');
      nextDetails.push(REASON_CODE_LABELS.SANITIZATION_GATE_PENDING);
    }
    return { reasonCodes: nextCodes, reasonDetails: nextDetails };
  };

  // 2. Priority 1: Safety dominance — swollen battery triggers immediate QUARANTINE before any economic scoring
  if (input.batterySafety === 'swollen') {
    const codes: ReasonCode[] = ['SAFETY_BATTERY_SWOLLEN'];
    const details: string[] = [REASON_CODE_LABELS.SAFETY_BATTERY_SWOLLEN];
    const withAdvisory = appendSanitizationAdvisory(codes, details);

    return {
      decision: 'QUARANTINE',
      ruleVersion: '1.0.0',
      reasonCodes: withAdvisory.reasonCodes,
      reasonDetails: withAdvisory.reasonDetails,
      missingFields: [],
      costBreakdown: null,
      repairCostCents: null,
      marginCents: null,
      sanitizationGateOpen,
      requiresHumanApproval: true,
    };
  }

  // 3. Priority 2: Check critical required inputs for economic evaluation
  const missingFields: string[] = [];
  if (input.boots === null || input.boots === undefined) {
    missingFields.push('boots');
  }
  if (input.repairable === null || input.repairable === undefined) {
    missingFields.push('repairable');
  }
  if (input.partsCostCents === null || input.partsCostCents === undefined) {
    missingFields.push('partsCostCents');
  }
  if (input.estimatedLaborMinutes === null || input.estimatedLaborMinutes === undefined) {
    missingFields.push('estimatedLaborMinutes');
  }
  if (input.comparableValueCents === null || input.comparableValueCents === undefined) {
    missingFields.push('comparableValueCents');
  }

  if (missingFields.length > 0) {
    const codes: ReasonCode[] = ['MISSING_CRITICAL_INPUTS'];
    const details: string[] = [
      `${REASON_CODE_LABELS.MISSING_CRITICAL_INPUTS} Missing: ${missingFields.join(', ')}.`,
    ];
    const withAdvisory = appendSanitizationAdvisory(codes, details);

    return {
      decision: 'INSUFFICIENT_DATA',
      ruleVersion: '1.0.0',
      reasonCodes: withAdvisory.reasonCodes,
      reasonDetails: withAdvisory.reasonDetails,
      missingFields,
      costBreakdown: null,
      repairCostCents: null,
      marginCents: null,
      sanitizationGateOpen,
      requiresHumanApproval: true,
    };
  }

  // 4. Compute deterministic integer-cents economics
  const partsCostCents = input.partsCostCents!;
  const estimatedLaborMinutes = input.estimatedLaborMinutes!;
  const comparableValueCents = input.comparableValueCents!;
  const laborCostCents = Math.round((estimatedLaborMinutes * config.hourlyRateCents) / 60);
  const overheadCents = config.overheadCents;
  const totalRepairCostCents = partsCostCents + laborCostCents + overheadCents;
  const marginCents = comparableValueCents - totalRepairCostCents;

  const costBreakdown: CostBreakdown = {
    partsCostCents,
    laborCostCents,
    overheadCents,
    totalRepairCostCents,
    comparableValueCents,
    marginCents,
    hourlyRateCents: config.hourlyRateCents,
    estimatedLaborMinutes,
  };

  // 5. Priority 3: Condition unknown or ambiguous battery safety -> REVIEW_REQUIRED
  if (input.condition === 'unknown' || input.batterySafety === 'unknown') {
    const codes: ReasonCode[] = [];
    const details: string[] = [];
    if (input.condition === 'unknown') {
      codes.push('UNVERIFIED_CONDITION');
      details.push(REASON_CODE_LABELS.UNVERIFIED_CONDITION);
    }
    if (input.batterySafety === 'unknown') {
      codes.push('AMBIGUOUS_BATTERY_SAFETY');
      details.push(REASON_CODE_LABELS.AMBIGUOUS_BATTERY_SAFETY);
    }
    const withAdvisory = appendSanitizationAdvisory(codes, details);

    return {
      decision: 'REVIEW_REQUIRED',
      ruleVersion: '1.0.0',
      reasonCodes: withAdvisory.reasonCodes,
      reasonDetails: withAdvisory.reasonDetails,
      missingFields: [],
      costBreakdown,
      repairCostCents: totalRepairCostCents,
      marginCents,
      sanitizationGateOpen,
      requiresHumanApproval: true,
    };
  }

  // 6. Priority 4: Not repairable AND negative margin -> RECYCLE_REVIEW
  if (input.repairable === false && marginCents < 0) {
    const codes: ReasonCode[] = ['NOT_REPAIRABLE_AND_NEGATIVE_MARGIN'];
    const details: string[] = [
      `${REASON_CODE_LABELS.NOT_REPAIRABLE_AND_NEGATIVE_MARGIN} (Repair cost ${formatCents(
        totalRepairCostCents
      )} vs. comparable value ${formatCents(comparableValueCents)}, net margin ${formatCents(
        marginCents
      )}).`,
    ];
    const withAdvisory = appendSanitizationAdvisory(codes, details);

    return {
      decision: 'RECYCLE_REVIEW',
      ruleVersion: '1.0.0',
      reasonCodes: withAdvisory.reasonCodes,
      reasonDetails: withAdvisory.reasonDetails,
      missingFields: [],
      costBreakdown,
      repairCostCents: totalRepairCostCents,
      marginCents,
      sanitizationGateOpen,
      requiresHumanApproval: true,
    };
  }

  // 7. Priority 5: Check REFURBISH_CANDIDATE criteria
  const laptopRamSatisfied =
    input.category !== 'laptop' ||
    (typeof input.ramGb === 'number' && input.ramGb >= config.minLaptopRamGb);

  if (
    input.boots === true &&
    input.repairable === true &&
    marginCents >= config.minMarginCents &&
    laptopRamSatisfied
  ) {
    const codes: ReasonCode[] = ['VIABLE_COST_AND_FUNCTION'];
    const details: string[] = [
      `${REASON_CODE_LABELS.VIABLE_COST_AND_FUNCTION} Estimated repair cost ${formatCents(
        totalRepairCostCents
      )} yields ${formatCents(marginCents)} net margin (threshold ${formatCents(
        config.minMarginCents
      )}).`,
    ];
    if (input.batterySafety === 'degraded') {
      codes.push('BATTERY_DEGRADED_NEEDS_CHECK');
      details.push(REASON_CODE_LABELS.BATTERY_DEGRADED_NEEDS_CHECK);
    }
    if (input.condition === 'poor') {
      codes.push('POOR_PHYSICAL_CONDITION');
      details.push(REASON_CODE_LABELS.POOR_PHYSICAL_CONDITION);
    }
    const withAdvisory = appendSanitizationAdvisory(codes, details);

    return {
      decision: 'REFURBISH_CANDIDATE',
      ruleVersion: '1.0.0',
      reasonCodes: withAdvisory.reasonCodes,
      reasonDetails: withAdvisory.reasonDetails,
      missingFields: [],
      costBreakdown,
      repairCostCents: totalRepairCostCents,
      marginCents,
      sanitizationGateOpen,
      requiresHumanApproval: true,
    };
  }

  // 8. Fallback: REVIEW_REQUIRED with explicit granular reason codes
  const reviewCodes: ReasonCode[] = [];
  const reviewDetails: string[] = [];

  if (input.boots === false) {
    reviewCodes.push('BOOT_FAILURE');
    reviewDetails.push(REASON_CODE_LABELS.BOOT_FAILURE);
  }
  if (input.repairable === false) {
    reviewCodes.push('REPAIRABILITY_UNCERTAIN');
    reviewDetails.push(REASON_CODE_LABELS.REPAIRABILITY_UNCERTAIN);
  }
  if (marginCents < config.minMarginCents) {
    reviewCodes.push('BELOW_MARGIN_THRESHOLD');
    reviewDetails.push(
      `${REASON_CODE_LABELS.BELOW_MARGIN_THRESHOLD} (Estimated margin ${formatCents(
        marginCents
      )} vs. required ${formatCents(config.minMarginCents)}).`
    );
  }
  if (input.category === 'laptop') {
    if (input.ramGb === null || input.ramGb === undefined) {
      reviewCodes.push('MISSING_LAPTOP_RAM');
      reviewDetails.push(REASON_CODE_LABELS.MISSING_LAPTOP_RAM);
    } else if (input.ramGb < config.minLaptopRamGb) {
      reviewCodes.push('LOW_RAM');
      reviewDetails.push(
        `${REASON_CODE_LABELS.LOW_RAM} (${input.ramGb} GB installed vs. ${config.minLaptopRamGb} GB target).`
      );
    }
  }
  if (input.condition === 'poor') {
    reviewCodes.push('POOR_PHYSICAL_CONDITION');
    reviewDetails.push(REASON_CODE_LABELS.POOR_PHYSICAL_CONDITION);
  }

  const withAdvisory = appendSanitizationAdvisory(reviewCodes, reviewDetails);

  return {
    decision: 'REVIEW_REQUIRED',
    ruleVersion: '1.0.0',
    reasonCodes: withAdvisory.reasonCodes,
    reasonDetails: withAdvisory.reasonDetails,
    missingFields: [],
    costBreakdown,
    repairCostCents: totalRepairCostCents,
    marginCents,
    sanitizationGateOpen,
    requiresHumanApproval: true,
  };
}
