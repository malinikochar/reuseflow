/**
 * ReuseFlow — Core Domain Contracts (v1.0.0)
 * Shared across public /demo sandbox and authenticated /app production repository.
 * Money is always represented in integer cents.
 */

export type DeviceCategory = 'laptop' | 'desktop' | 'tablet';
export type Condition = 'good' | 'fair' | 'poor' | 'unknown';
export type BatterySafety = 'normal' | 'degraded' | 'swollen' | 'unknown' | 'not_applicable';
export type SanitizationStatus = 'pending' | 'verified' | 'not_applicable';

export type Decision =
  | 'QUARANTINE'
  | 'INSUFFICIENT_DATA'
  | 'REFURBISH_CANDIDATE'
  | 'RECYCLE_REVIEW'
  | 'REVIEW_REQUIRED';

export type WorkflowStatus =
  | 'intake'
  | 'assessed'
  | 'approved_refurb'
  | 'repairing'
  | 'ready'
  | 'recycle_review'
  | 'quarantined'
  | 'closed';

export type Disposition = 'distributed' | 'recycled' | 'other_authorized';

export type UserRole = 'manager' | 'technician' | 'viewer';

export type ReasonCode =
  | 'SAFETY_BATTERY_SWOLLEN'
  | 'MISSING_CRITICAL_INPUTS'
  | 'UNVERIFIED_CONDITION'
  | 'AMBIGUOUS_BATTERY_SAFETY'
  | 'NOT_REPAIRABLE_AND_NEGATIVE_MARGIN'
  | 'VIABLE_COST_AND_FUNCTION'
  | 'BELOW_MARGIN_THRESHOLD'
  | 'LOW_RAM'
  | 'MISSING_LAPTOP_RAM'
  | 'BOOT_FAILURE'
  | 'REPAIRABILITY_UNCERTAIN'
  | 'POOR_PHYSICAL_CONDITION'
  | 'BATTERY_DEGRADED_NEEDS_CHECK'
  | 'SANITIZATION_GATE_PENDING';

export type AssessmentInput = {
  category: DeviceCategory;
  brand?: string;
  model?: string;
  ramGb?: number | null;
  storageGb?: number | null;
  boots?: boolean | null;
  condition: Condition;
  batterySafety: BatterySafety;
  storagePresent: boolean;
  repairable?: boolean | null;
  chargerIncluded?: boolean | null;
  partsCostCents?: number | null;
  estimatedLaborMinutes?: number | null;
  /** Manual staff estimate in integer cents — NOT scraped market truth */
  comparableValueCents?: number | null;
};

export type EngineConfig = {
  ruleVersion: '1.0.0';
  /** Loaded technician labor rate in integer cents per hour (default: 2000 = $20.00/hr) */
  hourlyRateCents: number;
  /** Minimum net positive margin in integer cents for high-priority refurbish candidate (default: 2000 = $20.00) */
  minMarginCents: number;
  /** Minimum laptop RAM in GB heuristic (default: 8) */
  minLaptopRamGb: number;
  /** Configurable processing overhead in integer cents (default: 0) */
  overheadCents: number;
  /** Hypothetical manual baseline minutes per assessment for Scenario Lab (default: 12) */
  baselineMinutes: number;
  /** Hypothetical target minutes per assessment for Scenario Lab (default: 6) */
  targetMinutes: number;
};

export type CostBreakdown = {
  partsCostCents: number;
  laborCostCents: number;
  overheadCents: number;
  totalRepairCostCents: number;
  comparableValueCents: number;
  marginCents: number;
  hourlyRateCents: number;
  estimatedLaborMinutes: number;
};

export type AssessmentResult = {
  decision: Decision;
  ruleVersion: '1.0.0';
  reasonCodes: ReasonCode[];
  reasonDetails: string[];
  missingFields: string[];
  costBreakdown: CostBreakdown | null;
  repairCostCents: number | null;
  marginCents: number | null;
  /** False if storagePresent is true and sanitizationStatus !== 'verified' */
  sanitizationGateOpen: boolean;
  requiresHumanApproval: true;
};

export type AssessmentRecord = AssessmentResult & {
  id: string;
  deviceId: string;
  inputSnapshot: AssessmentInput;
  configSnapshot: EngineConfig;
  assessedBy: string;
  assessedByName: string;
  createdAt: string;
};

export type WorkflowEvent = {
  id: string;
  deviceId: string;
  fromStatus: WorkflowStatus | null;
  toStatus: WorkflowStatus;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  note: string;
  createdAt: string;
};

export type Device = {
  id: string;
  assetTag: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  ramGb: number | null;
  storageGb: number | null;
  boots: boolean | null;
  condition: Condition;
  batterySafety: BatterySafety;
  storagePresent: boolean;
  repairable: boolean | null;
  chargerIncluded: boolean | null;
  partsCostCents: number | null;
  estimatedLaborMinutes: number | null;
  comparableValueCents: number | null;
  sanitizationStatus: SanitizationStatus;
  sanitizationVerifiedBy: string | null;
  sanitizationVerifiedAt: string | null;
  sanitizationNote: string | null;
  status: WorkflowStatus;
  disposition: Disposition | null;
  dispositionNote: string | null;
  latestAssessment: AssessmentRecord | null;
  assessments: AssessmentRecord[];
  workflowEvents: WorkflowEvent[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type DeviceFilters = {
  search?: string;
  category?: DeviceCategory | 'all';
  status?: WorkflowStatus | 'all';
  decision?: Decision | 'all';
};

export type ScenarioInput = {
  devicesPerMonth: number;
  baselineMinutesPerDevice: number;
  proposedMinutesPerDevice: number;
  hourlyLaborRateCents: number;
  implementationCostCents: number;
  monthlySoftwareCostCents: number;
};

export type ScenarioOutput = {
  minutesSavedPerDevice: number;
  monthlyHoursSaved: number;
  monthlyLaborValueCents: number;
  monthlyNetValueCents: number;
  simplePaybackMonths: number | null;
  paybackLabel: string;
};

export type ActionErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'FAILED_DEPENDENCY'
  | 'INTERNAL';

export type ActionResponse<T> =
  | { ok: true; data: T }
  | { ok: false; code: ActionErrorCode; message: string; fieldErrors?: Record<string, string[]> };

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  department: string;
  jobTitle: string;
  phone?: string;
  location?: string;
  bio?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type EmailEventRecord = {
  id: string;
  type: string;
  recipient: string;
  providerId: string | null;
  idempotencyKey: string;
  status: 'sent' | 'failed' | 'skipped';
  sentBy: string;
  createdAt: string;
};

export type AdminSystemOverview = {
  profiles: UserProfile[];
  emailEvents: EmailEventRecord[];
  counts: {
    users: number;
    devices: number;
    assessments: number;
    workflowEvents: number;
    emailEvents: number;
  };
};
