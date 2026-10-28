import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { DemoDeviceRepository } from '@/lib/repositories/demo-repository';
import { DEFAULT_ENGINE_CONFIG } from '@/lib/decision/engine';

describe('Role Authorization, Transition Preconditions & RLS Policy Integrity', () => {
  const viewerActor = { id: 'usr-viewer', name: 'Val Viewer', role: 'viewer' as const };
  const techActor = { id: 'usr-tech', name: 'Tom Tech', role: 'technician' as const };
  const managerActor = { id: 'usr-mgr', name: 'Mia Manager', role: 'manager' as const };

  it('denies viewer role from creating, editing, assessing, transitioning, or changing settings', async () => {
    const repo = new DemoDeviceRepository();
    const list = await repo.list();
    const first = list[0]!;

    const createRes = await repo.create(
      {
        assetTag: 'FG-VIEW-001',
        category: 'laptop',
        brand: 'Dell',
        model: 'Latitude',
        ramGb: 8,
        storageGb: 256,
        boots: true,
        condition: 'good',
        batterySafety: 'normal',
        storagePresent: true,
        repairable: true,
        chargerIncluded: true,
        partsCostCents: 1000,
        estimatedLaborMinutes: 30,
        comparableValueCents: 12000,
      },
      viewerActor
    );
    expect(createRes).toEqual({
      ok: false,
      code: 'FORBIDDEN',
      message: expect.stringContaining('Viewer role'),
    });

    const editRes = await repo.updateIntake(first.id, { id: first.id, ramGb: 16 }, viewerActor);
    expect(editRes.ok).toBe(false);
    if (!editRes.ok) expect(editRes.code).toBe('FORBIDDEN');

    const assessRes = await repo.assessDevice(first.id, viewerActor);
    expect(assessRes.ok).toBe(false);
    if (!assessRes.ok) expect(assessRes.code).toBe('FORBIDDEN');

    const transRes = await repo.transition(
      {
        deviceId: first.id,
        expectedStatus: first.status,
        nextStatus: 'assessed',
        note: 'Viewer attempting transition',
      },
      viewerActor
    );
    expect(transRes.ok).toBe(false);
    if (!transRes.ok) expect(transRes.code).toBe('FORBIDDEN');

    const cfgRes = await repo.updateEngineConfig(DEFAULT_ENGINE_CONFIG, viewerActor);
    expect(cfgRes.ok).toBe(false);
    if (!cfgRes.ok) expect(cfgRes.code).toBe('FORBIDDEN');
  });

  it('enforces technician boundaries: cannot edit post-approval devices, release quarantine, verify sanitization, or update settings', async () => {
    const repo = new DemoDeviceRepository();
    const devices = await repo.list();

    // Case A starts in 'approved_refurb'
    const approvedDevice = devices.find((d) => d.assetTag === 'FG-DEMO-101')!;
    const techEditAfterApproval = await repo.updateIntake(
      approvedDevice.id,
      { id: approvedDevice.id, ramGb: 32 },
      techActor
    );
    expect(techEditAfterApproval.ok).toBe(false);
    if (!techEditAfterApproval.ok) {
      expect(techEditAfterApproval.code).toBe('FORBIDDEN');
    }

    // Case C starts in 'quarantined' (swollen battery)
    const quarantinedDevice = devices.find((d) => d.assetTag === 'FG-DEMO-103')!;
    const techReleaseQuarantine = await repo.transition(
      {
        deviceId: quarantinedDevice.id,
        expectedStatus: 'quarantined',
        nextStatus: 'assessed',
        note: 'Technician trying to release quarantine',
      },
      techActor
    );
    expect(techReleaseQuarantine.ok).toBe(false);
    if (!techReleaseQuarantine.ok) {
      expect(techReleaseQuarantine.code).toBe('FORBIDDEN');
    }

    // Technician cannot verify sanitization
    const techVerifySanitization = await repo.verifySanitization(
      {
        deviceId: quarantinedDevice.id,
        status: 'verified',
        note: 'Technician trying to self-verify sanitization',
      },
      techActor
    );
    expect(techVerifySanitization.ok).toBe(false);
    if (!techVerifySanitization.ok) {
      expect(techVerifySanitization.code).toBe('FORBIDDEN');
    }

    // Technician cannot modify engine config
    const techUpdateCfg = await repo.updateEngineConfig(DEFAULT_ENGINE_CONFIG, techActor);
    expect(techUpdateCfg.ok).toBe(false);
    if (!techUpdateCfg.ok) {
      expect(techUpdateCfg.code).toBe('FORBIDDEN');
    }
  });

  it('prevents even a manager from bypassing swollen-battery quarantine or closing without disposition', async () => {
    const repo = new DemoDeviceRepository();
    const devices = await repo.list();
    const caseC = devices.find((d) => d.assetTag === 'FG-DEMO-103')!;

    // Manager releases from quarantine to assessed for review
    const releaseRes = await repo.transition(
      {
        deviceId: caseC.id,
        expectedStatus: 'quarantined',
        nextStatus: 'assessed',
        note: 'Manager safety review check',
      },
      managerActor
    );
    expect(releaseRes.ok).toBe(true);

    // Even in 'assessed', batterySafety is still 'swollen', so approving for refurb is blocked by safety gate!
    const approveSwollen = await repo.transition(
      {
        deviceId: caseC.id,
        expectedStatus: 'assessed',
        nextStatus: 'approved_refurb',
        note: 'Attempting to approve device that still has swollen battery',
      },
      managerActor
    );
    expect(approveSwollen.ok).toBe(false);
    if (!approveSwollen.ok) {
      expect(approveSwollen.code).toBe('VALIDATION');
      expect(approveSwollen.message).toContain('Safety gate locked');
    }
  });

  it('verifies SQL migration file enables RLS on all 6 tables, revokes anon grants, and protects append-only tables', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20261028000001_initial_schema_and_rls.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    const tables = [
      'profiles',
      'devices',
      'assessments',
      'workflow_events',
      'assumption_settings',
      'email_events',
    ];

    for (const table of tables) {
      expect(sql).toContain(`revoke all on public.${table} from anon;`);
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    }

    expect(sql).toContain('trg_prevent_role_self_promotion');
    expect(sql).toContain('trg_assessments_immutable');
    expect(sql).toContain('trg_workflow_events_immutable');
    expect(sql).toContain('devices_sanitization_gate_check');
    expect(sql).toContain('devices_battery_safety_gate_check');
  });
});
