import { describe, expect, it } from 'vitest';
import { DemoDeviceRepository } from '@/lib/repositories/demo-repository';

describe('DemoDeviceRepository Vertical Slice (Intake -> Assess -> Explain -> Approve)', () => {
  it('seeds all 6 PRD fixture cases and supports full intake -> assessment -> manager transition', async () => {
    const repo = new DemoDeviceRepository();
    const initial = await repo.list();
    expect(initial.length).toBe(6);

    const techActor = {
      id: 'tech-1',
      name: 'Taylor Tech',
      role: 'technician' as const,
    };
    const managerActor = {
      id: 'mgr-1',
      name: 'Morgan Manager',
      role: 'manager' as const,
    };

    // 1. Create device in intake
    const createdRes = await repo.create(
      {
        assetTag: 'FG-TEST-900',
        category: 'laptop',
        brand: 'Lenovo',
        model: 'ThinkPad T490',
        ramGb: 16,
        storageGb: 512,
        boots: true,
        condition: 'good',
        batterySafety: 'normal',
        storagePresent: true,
        repairable: true,
        chargerIncluded: true,
        partsCostCents: 2500, // $25.00
        estimatedLaborMinutes: 30, // $10.00 -> $35.00 total
        comparableValueCents: 19500, // $195.00 -> $160.00 margin
      },
      techActor
    );

    expect(createdRes.ok).toBe(true);
    if (!createdRes.ok) return;

    const device = createdRes.data;
    expect(device.status).toBe('assessed');
    expect(device.latestAssessment?.decision).toBe('REFURBISH_CANDIDATE');
    expect(device.latestAssessment?.repairCostCents).toBe(3500);
    expect(device.latestAssessment?.marginCents).toBe(16000);
    expect(device.latestAssessment?.sanitizationGateOpen).toBe(false);

    // 2. Technician cannot approve for refurbishment
    const techApprove = await repo.transition(
      {
        deviceId: device.id,
        expectedStatus: 'assessed',
        nextStatus: 'approved_refurb',
        note: 'Technician attempting manager approval',
      },
      techActor
    );
    expect(techApprove.ok).toBe(false);
    if (!techApprove.ok) {
      expect(techApprove.code).toBe('FORBIDDEN');
    }

    // 3. Manager approves for refurbishment
    const mgrApprove = await repo.transition(
      {
        deviceId: device.id,
        expectedStatus: 'assessed',
        nextStatus: 'approved_refurb',
        note: 'Approved for bench refurbishment based on $160 positive margin.',
      },
      managerActor
    );
    expect(mgrApprove.ok).toBe(true);

    // 4. Technician moves to repairing
    const toRepair = await repo.transition(
      {
        deviceId: device.id,
        expectedStatus: 'approved_refurb',
        nextStatus: 'repairing',
        note: 'Started keyboard and thermal paste service.',
      },
      techActor
    );
    expect(toRepair.ok).toBe(true);

    // 5. Manager attempts to mark ready BEFORE sanitization is verified -> blocked by sanitization gate!
    const prematureReady = await repo.transition(
      {
        deviceId: device.id,
        expectedStatus: 'repairing',
        nextStatus: 'ready',
        note: 'Trying to mark ready before wipe check',
      },
      managerActor
    );
    expect(prematureReady.ok).toBe(false);
    if (!prematureReady.ok) {
      expect(prematureReady.code).toBe('VALIDATION');
      expect(prematureReady.message).toContain('Data sanitization gate locked');
    }

    // 6. Manager records external sanitization verification
    const verifyRes = await repo.verifySanitization(
      {
        deviceId: device.id,
        status: 'verified',
        note: 'Verified external NVMe sanitize on bench station #3 (Log #NV-900).',
      },
      managerActor
    );
    expect(verifyRes.ok).toBe(true);

    // 7. Manager can now mark ready!
    const readyRes = await repo.transition(
      {
        deviceId: device.id,
        expectedStatus: 'repairing',
        nextStatus: 'ready',
        note: 'QA passed and sanitization verified; ready for community distribution.',
      },
      managerActor
    );
    expect(readyRes.ok).toBe(true);
    if (readyRes.ok) {
      expect(readyRes.data.device.status).toBe('ready');
      expect(readyRes.data.device.workflowEvents.length).toBeGreaterThanOrEqual(6);
    }
  });

  it('completes missing comparable value on Case E (FG-DEMO-105) and transitions from INSUFFICIENT_DATA to REFURBISH_CANDIDATE', async () => {
    const repo = new DemoDeviceRepository();
    const devices = await repo.list();
    const caseE = devices.find((d) => d.assetTag === 'FG-DEMO-105');
    expect(caseE).toBeDefined();
    if (!caseE) return;

    expect(caseE.status).toBe('intake');
    expect(caseE.latestAssessment?.decision).toBe('INSUFFICIENT_DATA');
    expect(caseE.latestAssessment?.missingFields).toContain('comparableValueCents');

    const techActor = {
      id: 'tech-1',
      name: 'Taylor Tech',
      role: 'technician' as const,
    };

    const updateRes = await repo.updateIntake(
      caseE.id,
      { comparableValueCents: 14000 },
      techActor
    );
    expect(updateRes.ok).toBe(true);

    const assessRes = await repo.assessDevice(caseE.id, techActor);
    expect(assessRes.ok).toBe(true);
    if (!assessRes.ok) return;

    expect(assessRes.data.device.status).toBe('assessed');
    expect(assessRes.data.assessment.decision).toBe('REFURBISH_CANDIDATE');
    expect(assessRes.data.assessment.marginCents).toBe(11833); // $140.00 - $21.67 ($15 parts + $6.67 labor)
  });
});
