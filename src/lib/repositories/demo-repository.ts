import {
  ActionResponse,
  AssessmentRecord,
  Device,
  DeviceFilters,
  EngineConfig,
  WorkflowEvent,
  WorkflowStatus,
} from '@/types/domain';
import {
  deviceCreateSchema,
  deviceUpdateIntakeSchema,
  engineConfigSchema,
  transitionDeviceSchema,
  verifySanitizationSchema,
} from '@/lib/validation/schemas';
import { DEFAULT_ENGINE_CONFIG, evaluateDevice } from '@/lib/decision/engine';
import {
  validateSanitizationUpdate,
  validateWorkflowTransition,
} from '@/lib/decision/workflow-guards';
import { buildSeedDemoDevices } from '@/fixtures/demo-devices';
import { ActorContext, DeviceRepository } from '@/lib/repositories/types';

const DEMO_STORAGE_KEY = 'reuseflow_demo_devices_v1';
const DEMO_CONFIG_KEY = 'reuseflow_demo_config_v1';

/**
 * Pure browser/in-memory synthetic demo repository.
 * NEVER imports or invokes Supabase or Resend.
 */
export class DemoDeviceRepository implements DeviceRepository {
  private memoryDevices: Device[];
  private memoryConfig: EngineConfig;

  constructor() {
    this.memoryDevices = buildSeedDemoDevices();
    this.memoryConfig = { ...DEFAULT_ENGINE_CONFIG };
    this.hydrateFromBrowserStorage();
  }

  private hydrateFromBrowserStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const rawDevices = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (rawDevices) {
        const parsed = JSON.parse(rawDevices) as Device[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryDevices = parsed;
        }
      } else {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(this.memoryDevices));
      }

      const rawConfig = window.localStorage.getItem(DEMO_CONFIG_KEY);
      if (rawConfig) {
        const parsedConfig = engineConfigSchema.safeParse(JSON.parse(rawConfig));
        if (parsedConfig.success) {
          this.memoryConfig = parsedConfig.data;
        }
      }
    } catch {
      // Fallback to in-memory seed if storage is unavailable
    }
  }

  private persistToBrowserStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(this.memoryDevices));
      window.localStorage.setItem(DEMO_CONFIG_KEY, JSON.stringify(this.memoryConfig));
    } catch {
      // Ignore storage quota errors in sandbox
    }
  }

  async resetDemo(): Promise<Device[]> {
    this.memoryDevices = buildSeedDemoDevices();
    this.memoryConfig = { ...DEFAULT_ENGINE_CONFIG };
    this.persistToBrowserStorage();
    return this.list();
  }

  async list(filters?: DeviceFilters): Promise<Device[]> {
    this.hydrateFromBrowserStorage();
    let result = [...this.memoryDevices];

    if (filters?.category && filters.category !== 'all') {
      result = result.filter((d) => d.category === filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((d) => d.status === filters.status);
    }
    if (filters?.decision && filters.decision !== 'all') {
      result = result.filter((d) => d.latestAssessment?.decision === filters.decision);
    }
    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.assetTag.toLowerCase().includes(q) ||
          d.brand.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async get(id: string): Promise<Device | null> {
    this.hydrateFromBrowserStorage();
    return this.memoryDevices.find((d) => d.id === id) ?? null;
  }

  async create(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ActionResponse<Device>> {
    this.hydrateFromBrowserStorage();
    if (actor.role === 'viewer') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Viewer role cannot create device intake records.',
      };
    }

    const parsed = deviceCreateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        code: 'VALIDATION',
        message: parsed.error.issues.map((i) => i.message).join(' '),
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const input = parsed.data;
    const duplicate = this.memoryDevices.some(
      (d) => d.assetTag.toLowerCase() === input.assetTag.toLowerCase()
    );
    if (duplicate) {
      return {
        ok: false,
        code: 'CONFLICT',
        message: `Asset tag '${input.assetTag}' already exists in inventory.`,
      };
    }

    const now = new Date().toISOString();
    const id = `demo-device-${Date.now()}`;
    const sanitizationStatus = input.storagePresent ? 'pending' : 'not_applicable';

    // Immediately compute initial deterministic assessment
    const evalResult = evaluateDevice(input, this.memoryConfig, sanitizationStatus);
    const assessmentRecord: AssessmentRecord = {
      ...evalResult,
      id: `demo-assessment-${Date.now()}`,
      deviceId: id,
      inputSnapshot: { ...input },
      configSnapshot: { ...this.memoryConfig },
      assessedBy: actor.id,
      assessedByName: actor.name,
      createdAt: now,
    };

    const initialStatus: WorkflowStatus =
      evalResult.decision === 'QUARANTINE'
        ? 'quarantined'
        : evalResult.decision === 'INSUFFICIENT_DATA'
          ? 'intake'
          : 'assessed';

    const events: WorkflowEvent[] = [
      {
        id: `demo-event-${Date.now()}-1`,
        deviceId: id,
        fromStatus: null,
        toStatus: 'intake',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        note: 'Device recorded at intake.',
        createdAt: now,
      },
    ];

    if (initialStatus !== 'intake') {
      events.push({
        id: `demo-event-${Date.now()}-2`,
        deviceId: id,
        fromStatus: 'intake',
        toStatus: initialStatus,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        note:
          initialStatus === 'quarantined'
            ? 'Automatic safety quarantine triggered due to swollen battery hazard.'
            : `Initial deterministic assessment v${evalResult.ruleVersion}: ${evalResult.decision}.`,
        createdAt: now,
      });
    }

    const newDevice: Device = {
      id,
      assetTag: input.assetTag,
      category: input.category,
      brand: input.brand,
      model: input.model,
      ramGb: input.ramGb ?? null,
      storageGb: input.storageGb ?? null,
      boots: input.boots ?? null,
      condition: input.condition,
      batterySafety: input.batterySafety,
      storagePresent: input.storagePresent,
      repairable: input.repairable ?? null,
      chargerIncluded: input.chargerIncluded ?? null,
      partsCostCents: input.partsCostCents ?? null,
      estimatedLaborMinutes: input.estimatedLaborMinutes ?? null,
      comparableValueCents: input.comparableValueCents ?? null,
      sanitizationStatus,
      sanitizationVerifiedBy: null,
      sanitizationVerifiedAt: null,
      sanitizationNote:
        sanitizationStatus === 'not_applicable'
          ? 'No storage media present at intake.'
          : null,
      status: initialStatus,
      disposition: null,
      dispositionNote: null,
      latestAssessment: assessmentRecord,
      assessments: [assessmentRecord],
      workflowEvents: events,
      createdBy: actor.id,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryDevices = [newDevice, ...this.memoryDevices];
    this.persistToBrowserStorage();
    return { ok: true, data: newDevice };
  }

  async updateIntake(
    id: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ActionResponse<Device>> {
    this.hydrateFromBrowserStorage();
    if (actor.role === 'viewer') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Viewer role cannot edit device intake fields.',
      };
    }

    const existing = this.memoryDevices.find((d) => d.id === id);
    if (!existing) {
      return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
    }

    if (
      actor.role === 'technician' &&
      existing.status !== 'intake' &&
      existing.status !== 'assessed'
    ) {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Technicians may only edit intake specs while the device is in intake or assessed status.',
      };
    }

    const parsed = deviceUpdateIntakeSchema.safeParse({ ...(rawInput as object), id });
    if (!parsed.success) {
      return {
        ok: false,
        code: 'VALIDATION',
        message: parsed.error.issues.map((i) => i.message).join(' '),
      };
    }

    const updates = parsed.data;
    if (updates.expectedUpdatedAt && updates.expectedUpdatedAt !== existing.updatedAt) {
      return {
        ok: false,
        code: 'CONFLICT',
        message: 'Device record was updated by another user. Please refresh.',
      };
    }

    const updatedStoragePresent = updates.storagePresent ?? existing.storagePresent;
    let updatedSanitization = existing.sanitizationStatus;
    if (updatedStoragePresent && existing.sanitizationStatus === 'not_applicable') {
      updatedSanitization = 'pending';
    } else if (!updatedStoragePresent) {
      updatedSanitization = 'not_applicable';
    }

    const updatedDevice: Device = {
      ...existing,
      category: updates.category ?? existing.category,
      brand: updates.brand ?? existing.brand,
      model: updates.model ?? existing.model,
      ramGb: updates.ramGb !== undefined ? updates.ramGb : existing.ramGb,
      storageGb: updates.storageGb !== undefined ? updates.storageGb : existing.storageGb,
      boots: updates.boots !== undefined ? updates.boots : existing.boots,
      condition: updates.condition ?? existing.condition,
      batterySafety: updates.batterySafety ?? existing.batterySafety,
      storagePresent: updatedStoragePresent,
      repairable: updates.repairable !== undefined ? updates.repairable : existing.repairable,
      chargerIncluded:
        updates.chargerIncluded !== undefined
          ? updates.chargerIncluded
          : existing.chargerIncluded,
      partsCostCents:
        updates.partsCostCents !== undefined
          ? updates.partsCostCents
          : existing.partsCostCents,
      estimatedLaborMinutes:
        updates.estimatedLaborMinutes !== undefined
          ? updates.estimatedLaborMinutes
          : existing.estimatedLaborMinutes,
      comparableValueCents:
        updates.comparableValueCents !== undefined
          ? updates.comparableValueCents
          : existing.comparableValueCents,
      sanitizationStatus: updatedSanitization,
      updatedAt: new Date().toISOString(),
    };

    this.memoryDevices = this.memoryDevices.map((d) => (d.id === id ? updatedDevice : d));
    this.persistToBrowserStorage();
    return { ok: true, data: updatedDevice };
  }

  async assessDevice(
    id: string,
    actor: ActorContext,
    customConfig?: EngineConfig
  ): Promise<ActionResponse<{ device: Device; assessment: AssessmentRecord }>> {
    this.hydrateFromBrowserStorage();
    if (actor.role === 'viewer') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Viewer role cannot trigger device assessments.',
      };
    }

    const existing = this.memoryDevices.find((d) => d.id === id);
    if (!existing) {
      return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
    }

    const configToUse = customConfig ?? this.memoryConfig;
    const inputSnapshot = {
      category: existing.category,
      brand: existing.brand,
      model: existing.model,
      ramGb: existing.ramGb,
      storageGb: existing.storageGb,
      boots: existing.boots,
      condition: existing.condition,
      batterySafety: existing.batterySafety,
      storagePresent: existing.storagePresent,
      repairable: existing.repairable,
      chargerIncluded: existing.chargerIncluded,
      partsCostCents: existing.partsCostCents,
      estimatedLaborMinutes: existing.estimatedLaborMinutes,
      comparableValueCents: existing.comparableValueCents,
    };

    const evalResult = evaluateDevice(
      inputSnapshot,
      configToUse,
      existing.sanitizationStatus
    );
    const now = new Date().toISOString();

    const assessmentRecord: AssessmentRecord = {
      ...evalResult,
      id: `demo-assessment-${Date.now()}`,
      deviceId: existing.id,
      inputSnapshot,
      configSnapshot: { ...configToUse },
      assessedBy: actor.id,
      assessedByName: actor.name,
      createdAt: now,
    };

    // Append-only assessment history
    let nextStatus = existing.status;
    const nextEvents = [...existing.workflowEvents];

    if (evalResult.decision === 'QUARANTINE' && existing.status !== 'quarantined') {
      nextStatus = 'quarantined';
      nextEvents.push({
        id: `demo-event-${Date.now()}`,
        deviceId: existing.id,
        fromStatus: existing.status,
        toStatus: 'quarantined',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        note: 'Safety quarantine triggered during assessment (swollen battery).',
        createdAt: now,
      });
    } else if (existing.status === 'intake' && evalResult.decision !== 'INSUFFICIENT_DATA') {
      nextStatus = 'assessed';
      nextEvents.push({
        id: `demo-event-${Date.now()}`,
        deviceId: existing.id,
        fromStatus: 'intake',
        toStatus: 'assessed',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        note: `Re-assessed with rule v${evalResult.ruleVersion}: ${evalResult.decision}.`,
        createdAt: now,
      });
    }

    const updatedDevice: Device = {
      ...existing,
      status: nextStatus,
      latestAssessment: assessmentRecord,
      assessments: [assessmentRecord, ...existing.assessments],
      workflowEvents: nextEvents,
      updatedAt: now,
    };

    this.memoryDevices = this.memoryDevices.map((d) => (d.id === id ? updatedDevice : d));
    this.persistToBrowserStorage();
    return { ok: true, data: { device: updatedDevice, assessment: assessmentRecord } };
  }

  async transition(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ActionResponse<{ device: Device; event: WorkflowEvent }>> {
    this.hydrateFromBrowserStorage();
    const parsed = transitionDeviceSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        code: 'VALIDATION',
        message: parsed.error.issues.map((i) => i.message).join(' '),
      };
    }

    const input = parsed.data;
    const existing = this.memoryDevices.find((d) => d.id === input.deviceId);
    if (!existing) {
      return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
    }

    const guardCheck = validateWorkflowTransition({
      device: existing,
      expectedStatus: input.expectedStatus,
      nextStatus: input.nextStatus,
      actorRole: actor.role,
      note: input.note,
      disposition: input.disposition,
    });

    if (!guardCheck.ok) {
      return guardCheck;
    }

    const now = new Date().toISOString();
    const event: WorkflowEvent = {
      id: `demo-event-${Date.now()}`,
      deviceId: existing.id,
      fromStatus: existing.status,
      toStatus: input.nextStatus,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      note: input.note.trim(),
      createdAt: now,
    };

    const updatedDevice: Device = {
      ...existing,
      status: input.nextStatus,
      disposition:
        input.nextStatus === 'closed' ? (input.disposition ?? null) : existing.disposition,
      dispositionNote:
        input.nextStatus === 'closed' ? input.note.trim() : existing.dispositionNote,
      workflowEvents: [...existing.workflowEvents, event],
      updatedAt: now,
    };

    this.memoryDevices = this.memoryDevices.map((d) =>
      d.id === existing.id ? updatedDevice : d
    );
    this.persistToBrowserStorage();
    return { ok: true, data: { device: updatedDevice, event } };
  }

  async verifySanitization(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ActionResponse<Device>> {
    this.hydrateFromBrowserStorage();
    const parsed = verifySanitizationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        code: 'VALIDATION',
        message: parsed.error.issues.map((i) => i.message).join(' '),
      };
    }

    const input = parsed.data;
    const existing = this.memoryDevices.find((d) => d.id === input.deviceId);
    if (!existing) {
      return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
    }

    const check = validateSanitizationUpdate({
      device: existing,
      newStatus: input.status,
      actorRole: actor.role,
      note: input.note,
    });

    if (!check.ok) {
      return check;
    }

    const now = new Date().toISOString();
    const auditEvent: WorkflowEvent = {
      id: `demo-event-${Date.now()}`,
      deviceId: existing.id,
      fromStatus: existing.status,
      toStatus: existing.status,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      note: `[External Sanitization Recorded: ${input.status.toUpperCase()}] ${input.note.trim()}`,
      createdAt: now,
    };

    // Recompute latest assessment sanitizationGateOpen flag without mutating historical snapshots
    let updatedLatest = existing.latestAssessment;
    if (updatedLatest) {
      updatedLatest = {
        ...updatedLatest,
        sanitizationGateOpen: !existing.storagePresent || input.status === 'verified',
      };
    }

    const updatedDevice: Device = {
      ...existing,
      sanitizationStatus: input.status,
      sanitizationVerifiedBy: actor.name,
      sanitizationVerifiedAt: now,
      sanitizationNote: input.note.trim(),
      latestAssessment: updatedLatest,
      workflowEvents: [...existing.workflowEvents, auditEvent],
      updatedAt: now,
    };

    this.memoryDevices = this.memoryDevices.map((d) =>
      d.id === existing.id ? updatedDevice : d
    );
    this.persistToBrowserStorage();
    return { ok: true, data: updatedDevice };
  }

  async getEngineConfig(): Promise<EngineConfig> {
    this.hydrateFromBrowserStorage();
    return { ...this.memoryConfig };
  }

  async updateEngineConfig(
    rawConfig: EngineConfig,
    actor: ActorContext
  ): Promise<ActionResponse<EngineConfig>> {
    this.hydrateFromBrowserStorage();
    if (actor.role !== 'manager') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Only a Refurbishment Manager can update illustrative economic assumptions.',
      };
    }

    const parsed = engineConfigSchema.safeParse(rawConfig);
    if (!parsed.success) {
      return {
        ok: false,
        code: 'VALIDATION',
        message: parsed.error.issues.map((i) => i.message).join(' '),
      };
    }

    this.memoryConfig = parsed.data;
    this.persistToBrowserStorage();
    return { ok: true, data: { ...this.memoryConfig } };
  }
}
