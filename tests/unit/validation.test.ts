import { describe, expect, it } from 'vitest';
import {
  validateSanitizationUpdate,
  validateWorkflowTransition,
} from '@/lib/decision/workflow-guards';
import { escapeCsvCell } from '@/components/devices/device-table-and-filters';

describe('Workflow Guards, Sanitization Gates & CSV Export Security', () => {
  it('blocks non-managers from approving refurbishment or closing devices', () => {
    const res = validateWorkflowTransition({
      device: {
        status: 'assessed',
        storagePresent: false,
        sanitizationStatus: 'not_applicable',
        batterySafety: 'normal',
      },
      expectedStatus: 'assessed',
      nextStatus: 'approved_refurb',
      actorRole: 'technician',
      note: 'Trying to approve my own intake device',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('FORBIDDEN');
    }
  });

  it('blocks storage-bearing device from transitioning to ready or closed when sanitization is pending', () => {
    const res = validateWorkflowTransition({
      device: {
        status: 'repairing',
        storagePresent: true,
        sanitizationStatus: 'pending',
        batterySafety: 'normal',
      },
      expectedStatus: 'repairing',
      nextStatus: 'ready',
      actorRole: 'manager',
      note: 'Repair complete, moving to ready',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('VALIDATION');
      expect(res.message).toContain('Data sanitization gate locked');
    }
  });

  it('allows storage-bearing device to move to ready once sanitization is verified by manager', () => {
    const res = validateWorkflowTransition({
      device: {
        status: 'repairing',
        storagePresent: true,
        sanitizationStatus: 'verified',
        batterySafety: 'normal',
      },
      expectedStatus: 'repairing',
      nextStatus: 'ready',
      actorRole: 'manager',
      note: 'Sanitization verified externally and bench QA passed.',
    });

    expect(res.ok).toBe(true);
  });

  it('returns CONFLICT when expectedStatus does not match current device status', () => {
    const res = validateWorkflowTransition({
      device: {
        status: 'quarantined',
        storagePresent: true,
        sanitizationStatus: 'pending',
        batterySafety: 'swollen',
      },
      expectedStatus: 'assessed',
      nextStatus: 'approved_refurb',
      actorRole: 'manager',
      note: 'Approving stale view',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('CONFLICT');
    }
  });

  it('blocks marking sanitization as not_applicable when storage media is present', () => {
    const res = validateSanitizationUpdate({
      device: { storagePresent: true },
      newStatus: 'not_applicable',
      actorRole: 'manager',
      note: 'Trying to bypass storage check',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('VALIDATION');
    }
  });

  it('blocks approving refurbishment when latestAssessment decision is INSUFFICIENT_DATA', () => {
    const res = validateWorkflowTransition({
      device: {
        status: 'assessed',
        storagePresent: true,
        sanitizationStatus: 'pending',
        batterySafety: 'normal',
        latestAssessment: { decision: 'INSUFFICIENT_DATA' },
      },
      expectedStatus: 'assessed',
      nextStatus: 'approved_refurb',
      actorRole: 'manager',
      note: 'Attempting to approve with missing comparable value',
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('VALIDATION');
      expect(res.message).toContain('Missing critical inputs gate locked');
    }
  });

  it('neutralizes CSV formula injection payloads while preserving negative currency numbers', () => {
    expect(escapeCsvCell('=1+1')).toBe("'=1+1");
    expect(escapeCsvCell('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)");
    expect(escapeCsvCell('-CMD|calc')).toBe("'-CMD|calc");
    expect(escapeCsvCell('@IMPORTXML("http://evil.example")')).toBe(
      '"\'@IMPORTXML(""http://evil.example"")"'
    );
    expect(escapeCsvCell('-140.00')).toBe('-140.00');
    expect(escapeCsvCell('Lenovo ThinkPad T480')).toBe('Lenovo ThinkPad T480');
  });
});
