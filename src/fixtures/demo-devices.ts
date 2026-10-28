import {
  AssessmentInput,
  AssessmentRecord,
  Device,
  SanitizationStatus,
  WorkflowEvent,
  WorkflowStatus,
} from '@/types/domain';
import { DEFAULT_ENGINE_CONFIG, evaluateDevice } from '@/lib/decision/engine';

export type CanonicalFixtureCase = {
  id: 'case_a' | 'case_b' | 'case_c' | 'case_d' | 'case_e' | 'case_f';
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  title: string;
  summary: string;
  assetTag: string;
  sanitizationStatus: SanitizationStatus;
  initialWorkflowStatus: WorkflowStatus;
  input: AssessmentInput;
};

/**
 * Six worked fictional fixture cases from ReuseFlow_PRD.md §6.4.
 * Zero real serial numbers, donor names, or personal data.
 */
export const PRD_FIXTURE_CASES: CanonicalFixtureCase[] = [
  {
    id: 'case_a',
    code: 'A',
    title: 'Case A — Viable Refurbish Laptop',
    summary: 'Boots, repairable, 8 GB RAM, $20 parts, 45 min labor, $180 value -> $35 cost, $145 margin',
    assetTag: 'FG-DEMO-101',
    sanitizationStatus: 'verified',
    initialWorkflowStatus: 'approved_refurb',
    input: {
      category: 'laptop',
      brand: 'Lenovo',
      model: 'ThinkPad T480 (Sample)',
      ramGb: 8,
      storageGb: 256,
      boots: true,
      condition: 'good',
      batterySafety: 'normal',
      storagePresent: true,
      repairable: true,
      chargerIncluded: true,
      partsCostCents: 2000, // $20.00
      estimatedLaborMinutes: 45, // $15.00 at $20/hr -> $35.00 total
      comparableValueCents: 18000, // $180.00 -> $145.00 margin
    },
  },
  {
    id: 'case_b',
    code: 'B',
    title: 'Case B — Borderline Low-RAM / Low-Margin Laptop',
    summary: 'Boots, repairable, 4 GB RAM, $40 parts, 90 min labor, $70 value -> $70 cost, $0 margin',
    assetTag: 'FG-DEMO-102',
    sanitizationStatus: 'pending',
    initialWorkflowStatus: 'assessed',
    input: {
      category: 'laptop',
      brand: 'Dell',
      model: 'Latitude E5450 (Sample)',
      ramGb: 4,
      storageGb: 128,
      boots: true,
      condition: 'fair',
      batterySafety: 'normal',
      storagePresent: true,
      repairable: true,
      chargerIncluded: false,
      partsCostCents: 4000, // $40.00
      estimatedLaborMinutes: 90, // $30.00 -> $70.00 total
      comparableValueCents: 7000, // $70.00 -> $0.00 margin (< $20 threshold)
    },
  },
  {
    id: 'case_c',
    code: 'C',
    title: 'Case C — Swollen Battery Safety Hazard',
    summary: 'Swollen battery overrides high specs/value and triggers immediate QUARANTINE',
    assetTag: 'FG-DEMO-103',
    sanitizationStatus: 'pending',
    initialWorkflowStatus: 'quarantined',
    input: {
      category: 'laptop',
      brand: 'HP',
      model: 'EliteBook 840 G5 (Sample)',
      ramGb: 16,
      storageGb: 512,
      boots: true,
      condition: 'fair',
      batterySafety: 'swollen',
      storagePresent: true,
      repairable: true,
      chargerIncluded: true,
      partsCostCents: 3500,
      estimatedLaborMinutes: 30,
      comparableValueCents: 24000,
    },
  },
  {
    id: 'case_d',
    code: 'D',
    title: 'Case D — Economically Unviable / Irreparable',
    summary: 'No boot, not repairable, $200 parts, 60 min labor, $80 value -> RECYCLE_REVIEW',
    assetTag: 'FG-DEMO-104',
    sanitizationStatus: 'not_applicable',
    initialWorkflowStatus: 'recycle_review',
    input: {
      category: 'desktop',
      brand: 'HP',
      model: 'ProDesk 600 G2 SFF (Sample)',
      ramGb: 8,
      storageGb: null,
      boots: false,
      condition: 'poor',
      batterySafety: 'not_applicable',
      storagePresent: false,
      repairable: false,
      chargerIncluded: true,
      partsCostCents: 20000, // $200.00
      estimatedLaborMinutes: 60, // $20.00 -> $220.00 total
      comparableValueCents: 8000, // $80.00 -> -$140.00 margin
    },
  },
  {
    id: 'case_e',
    code: 'E',
    title: 'Case E — Missing Comparable Value Input',
    summary: 'Missing critical input (comparableValueCents) -> INSUFFICIENT_DATA',
    assetTag: 'FG-DEMO-105',
    sanitizationStatus: 'pending',
    initialWorkflowStatus: 'intake',
    input: {
      category: 'tablet',
      brand: 'Apple',
      model: 'iPad 7th Gen 32GB (Sample)',
      ramGb: 3,
      storageGb: 32,
      boots: true,
      condition: 'good',
      batterySafety: 'normal',
      storagePresent: true,
      repairable: true,
      chargerIncluded: false,
      partsCostCents: 1500,
      estimatedLaborMinutes: 20,
      comparableValueCents: null,
    },
  },
  {
    id: 'case_f',
    code: 'F',
    title: 'Case F — Viable Refurbish with Pending Sanitization Gate',
    summary: 'Economically viable desktop ($115 margin), but storagePresent=true with pending wipe blocks ready/closed gate',
    assetTag: 'FG-DEMO-106',
    sanitizationStatus: 'pending',
    initialWorkflowStatus: 'repairing',
    input: {
      category: 'desktop',
      brand: 'Dell',
      model: 'OptiPlex 7060 Micro (Sample)',
      ramGb: 16,
      storageGb: 512,
      boots: true,
      condition: 'good',
      batterySafety: 'not_applicable',
      storagePresent: true,
      repairable: true,
      chargerIncluded: true,
      partsCostCents: 1500, // $15.00
      estimatedLaborMinutes: 30, // $10.00 -> $25.00 total
      comparableValueCents: 14000, // $140.00 -> $115.00 margin
    },
  },
];

export function buildSeedDemoDevices(): Device[] {
  const baseTimestamps = [
    '2026-10-28T09:15:00.000Z',
    '2026-10-28T10:05:00.000Z',
    '2026-10-28T10:40:00.000Z',
    '2026-10-28T11:20:00.000Z',
    '2026-10-28T12:10:00.000Z',
    '2026-10-28T13:00:00.000Z',
  ];

  return PRD_FIXTURE_CASES.map((fixture, index) => {
    const createdAt = baseTimestamps[index] ?? '2026-10-28T12:00:00.000Z';
    const result = evaluateDevice(
      fixture.input,
      DEFAULT_ENGINE_CONFIG,
      fixture.sanitizationStatus
    );

    const deviceId = `demo-device-${fixture.code.toLowerCase()}`;
    const assessmentRecord: AssessmentRecord = {
      ...result,
      id: `demo-assessment-${fixture.code.toLowerCase()}-1`,
      deviceId,
      inputSnapshot: { ...fixture.input },
      configSnapshot: { ...DEFAULT_ENGINE_CONFIG },
      assessedBy: 'demo-tech-1',
      assessedByName: 'Alex Rivera (Sample Tech)',
      createdAt,
    };

    const workflowEvents: WorkflowEvent[] = [
      {
        id: `demo-event-${fixture.code.toLowerCase()}-1`,
        deviceId,
        fromStatus: null,
        toStatus: 'intake' as WorkflowStatus,
        actorId: 'demo-tech-1',
        actorName: 'Alex Rivera (Sample Tech)',
        actorRole: 'technician',
        note: `Initial intake recorded for ${fixture.title}.`,
        createdAt,
      },
    ];

    if (fixture.initialWorkflowStatus !== 'intake') {
      workflowEvents.push({
        id: `demo-event-${fixture.code.toLowerCase()}-2`,
        deviceId,
        fromStatus: 'intake',
        toStatus:
          fixture.initialWorkflowStatus === 'quarantined' ? 'quarantined' : 'assessed',
        actorId: 'demo-tech-1',
        actorName: 'Alex Rivera (Sample Tech)',
        actorRole: 'technician' as const,
        note:
          fixture.initialWorkflowStatus === 'quarantined'
            ? 'Swollen battery detected during intake check; isolated in safety quarantine.'
            : `Deterministic assessment v1.0.0 completed (${result.decision}).`,
        createdAt: new Date(new Date(createdAt).getTime() + 5 * 60_000).toISOString(),
      });
    }

    if (
      fixture.initialWorkflowStatus === 'approved_refurb' ||
      fixture.initialWorkflowStatus === 'repairing' ||
      fixture.initialWorkflowStatus === 'recycle_review'
    ) {
      workflowEvents.push({
        id: `demo-event-${fixture.code.toLowerCase()}-3`,
        deviceId,
        fromStatus: 'assessed',
        toStatus:
          fixture.initialWorkflowStatus === 'repairing'
            ? 'approved_refurb'
            : fixture.initialWorkflowStatus,
        actorId: 'demo-mgr-1',
        actorName: 'Morgan Chen (Sample Manager)',
        actorRole: 'manager' as const,
        note:
          fixture.initialWorkflowStatus === 'recycle_review'
            ? 'Manager confirmed negative repair margin and non-repairable mainboard; queued for recycle review.'
            : 'Manager approved refurbishment candidate based on positive net margin.',
        createdAt: new Date(new Date(createdAt).getTime() + 15 * 60_000).toISOString(),
      });
    }

    if (fixture.initialWorkflowStatus === 'repairing') {
      workflowEvents.push({
        id: `demo-event-${fixture.code.toLowerCase()}-4`,
        deviceId,
        fromStatus: 'approved_refurb',
        toStatus: 'repairing',
        actorId: 'demo-tech-1',
        actorName: 'Alex Rivera (Sample Tech)',
        actorRole: 'technician' as const,
        note: 'Bench repair started; awaiting external storage sanitization verification before marking ready.',
        createdAt: new Date(new Date(createdAt).getTime() + 25 * 60_000).toISOString(),
      });
    }

    return {
      id: deviceId,
      assetTag: fixture.assetTag,
      category: fixture.input.category,
      brand: fixture.input.brand ?? 'Generic',
      model: fixture.input.model ?? 'Sample Model',
      ramGb: fixture.input.ramGb ?? null,
      storageGb: fixture.input.storageGb ?? null,
      boots: fixture.input.boots ?? null,
      condition: fixture.input.condition,
      batterySafety: fixture.input.batterySafety,
      storagePresent: fixture.input.storagePresent,
      repairable: fixture.input.repairable ?? null,
      chargerIncluded: fixture.input.chargerIncluded ?? null,
      partsCostCents: fixture.input.partsCostCents ?? null,
      estimatedLaborMinutes: fixture.input.estimatedLaborMinutes ?? null,
      comparableValueCents: fixture.input.comparableValueCents ?? null,
      sanitizationStatus: fixture.sanitizationStatus,
      sanitizationVerifiedBy:
        fixture.sanitizationStatus === 'verified' ? 'Morgan Chen (Sample Manager)' : null,
      sanitizationVerifiedAt:
        fixture.sanitizationStatus === 'verified'
          ? new Date(new Date(createdAt).getTime() + 12 * 60_000).toISOString()
          : null,
      sanitizationNote:
        fixture.sanitizationStatus === 'verified'
          ? 'External NIST 800-88 clear verified on bench #2 (Ref: SAN-2026-101).'
          : fixture.sanitizationStatus === 'not_applicable'
            ? 'No drive caddies or non-volatile storage media installed at intake.'
            : null,
      status: fixture.initialWorkflowStatus,
      disposition: null,
      dispositionNote: null,
      latestAssessment: assessmentRecord,
      assessments: [assessmentRecord],
      workflowEvents,
      createdBy: 'demo-tech-1',
      createdAt,
      updatedAt: workflowEvents[workflowEvents.length - 1]?.createdAt ?? createdAt,
    };
  });
}
