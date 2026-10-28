'use server';

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
import { getVerifiedServerActor } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface DbDeviceRow {
  id: string;
  asset_tag: string;
  category: Device['category'];
  brand: string;
  model: string;
  ram_gb: number | null;
  storage_gb: number | null;
  boots: boolean | null;
  condition: Device['condition'];
  battery_safety: Device['batterySafety'];
  storage_present: boolean;
  repairable: boolean | null;
  charger_included: boolean | null;
  parts_cost_cents: number | null;
  estimated_labor_minutes: number | null;
  comparable_value_cents: number | null;
  sanitization_status: Device['sanitizationStatus'];
  sanitization_verified_by: string | null;
  sanitization_verified_at: string | null;
  sanitization_note: string | null;
  status: Device['status'];
  disposition: Device['disposition'];
  disposition_note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assessments?: DbAssessmentRow[];
  workflow_events?: DbWorkflowEventRow[];
}

interface DbAssessmentRow {
  id: string;
  device_id: string;
  input_snapshot: AssessmentRecord['inputSnapshot'];
  config_snapshot: EngineConfig;
  decision: AssessmentRecord['decision'];
  rule_version: '1.0.0';
  reason_codes: AssessmentRecord['reasonCodes'];
  reason_details: string[];
  missing_fields: string[];
  cost_breakdown: AssessmentRecord['costBreakdown'];
  repair_cost_cents: number | null;
  margin_cents: number | null;
  sanitization_gate_open: boolean;
  assessed_by: string;
  assessed_by_name: string;
  created_at: string;
}

interface DbWorkflowEventRow {
  id: string;
  device_id: string;
  from_status: WorkflowStatus | null;
  to_status: WorkflowStatus;
  actor_id: string;
  actor_name: string;
  actor_role: WorkflowEvent['actorRole'];
  note: string;
  created_at: string;
}

function mapDbDevice(row: DbDeviceRow): Device {
  const assessments: AssessmentRecord[] = (row.assessments ?? [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((a) => ({
      id: a.id,
      deviceId: a.device_id,
      decision: a.decision,
      ruleVersion: '1.0.0',
      reasonCodes: a.reason_codes ?? [],
      reasonDetails: a.reason_details ?? [],
      missingFields: a.missing_fields ?? [],
      costBreakdown: a.cost_breakdown ?? null,
      repairCostCents: a.repair_cost_cents,
      marginCents: a.margin_cents,
      sanitizationGateOpen: a.sanitization_gate_open,
      requiresHumanApproval: true,
      inputSnapshot: a.input_snapshot,
      configSnapshot: a.config_snapshot ?? DEFAULT_ENGINE_CONFIG,
      assessedBy: a.assessed_by,
      assessedByName: a.assessed_by_name,
      createdAt: a.created_at,
    }));

  const workflowEvents: WorkflowEvent[] = (row.workflow_events ?? [])
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((e) => ({
      id: e.id,
      deviceId: e.device_id,
      fromStatus: e.from_status,
      toStatus: e.to_status,
      actorId: e.actor_id,
      actorName: e.actor_name,
      actorRole: e.actor_role,
      note: e.note,
      createdAt: e.created_at,
    }));

  return {
    id: row.id,
    assetTag: row.asset_tag,
    category: row.category,
    brand: row.brand,
    model: row.model,
    ramGb: row.ram_gb,
    storageGb: row.storage_gb,
    boots: row.boots,
    condition: row.condition,
    batterySafety: row.battery_safety,
    storagePresent: row.storage_present,
    repairable: row.repairable,
    chargerIncluded: row.charger_included,
    partsCostCents: row.parts_cost_cents,
    estimatedLaborMinutes: row.estimated_labor_minutes,
    comparableValueCents: row.comparable_value_cents,
    sanitizationStatus: row.sanitization_status,
    sanitizationVerifiedBy: row.sanitization_verified_by,
    sanitizationVerifiedAt: row.sanitization_verified_at,
    sanitizationNote: row.sanitization_note,
    status: row.status,
    disposition: row.disposition,
    dispositionNote: row.disposition_note,
    latestAssessment: assessments[0]
      ? {
          ...assessments[0],
          sanitizationGateOpen:
            !row.storage_present || row.sanitization_status === 'verified',
        }
      : null,
    assessments,
    workflowEvents,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDevicesServerAction(
  filters?: DeviceFilters
): Promise<ActionResponse<Device[]>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required to read production device inventory.',
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      code: 'FAILED_DEPENDENCY',
      message: 'Supabase environment variables are not configured.',
    };
  }

  let query = supabase
    .from('devices')
    .select('*, assessments(*), workflow_events(*)')
    .order('updated_at', { ascending: false });

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    return {
      ok: false,
      code: 'INTERNAL',
      message: 'Failed to load device inventory from database.',
    };
  }

  let mapped = ((data as unknown as DbDeviceRow[]) ?? []).map(mapDbDevice);

  if (filters?.decision && filters.decision !== 'all') {
    mapped = mapped.filter((d) => d.latestAssessment?.decision === filters.decision);
  }
  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    mapped = mapped.filter(
      (d) =>
        d.assetTag.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q)
    );
  }

  return { ok: true, data: mapped };
}

export async function getDeviceServerAction(
  id: string
): Promise<ActionResponse<Device | null>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      code: 'FAILED_DEPENDENCY',
      message: 'Supabase not configured.',
    };
  }

  const { data, error } = await supabase
    .from('devices')
    .select('*, assessments(*), workflow_events(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { ok: false, code: 'INTERNAL', message: 'Could not load device record.' };
  }
  return { ok: true, data: data ? mapDbDevice(data as unknown as DbDeviceRow) : null };
}

export async function getEngineConfigServerAction(): Promise<EngineConfig> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return DEFAULT_ENGINE_CONFIG;

  const { data } = await supabase
    .from('assumption_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (!data) return DEFAULT_ENGINE_CONFIG;

  return {
    ruleVersion: '1.0.0',
    hourlyRateCents: data.hourly_rate_cents ?? DEFAULT_ENGINE_CONFIG.hourlyRateCents,
    minMarginCents: data.min_margin_cents ?? DEFAULT_ENGINE_CONFIG.minMarginCents,
    minLaptopRamGb: data.min_laptop_ram_gb ?? DEFAULT_ENGINE_CONFIG.minLaptopRamGb,
    overheadCents: data.overhead_cents ?? DEFAULT_ENGINE_CONFIG.overheadCents,
    baselineMinutes: data.baseline_minutes ?? DEFAULT_ENGINE_CONFIG.baselineMinutes,
    targetMinutes: data.target_minutes ?? DEFAULT_ENGINE_CONFIG.targetMinutes,
  };
}

export async function createDeviceServerAction(
  rawInput: unknown
): Promise<ActionResponse<Device>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Please sign in first.' };
  }

  if (auth.actor.role === 'viewer') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Viewer role is read-only and cannot create device records.',
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      code: 'FAILED_DEPENDENCY',
      message: 'Supabase not configured.',
    };
  }

  const input = parsed.data;
  const config = await getEngineConfigServerAction();
  const sanitizationStatus = input.storagePresent ? 'pending' : 'not_applicable';
  const evalResult = evaluateDevice(input, config, sanitizationStatus);

  const initialStatus: WorkflowStatus =
    evalResult.decision === 'QUARANTINE'
      ? 'quarantined'
      : evalResult.decision === 'INSUFFICIENT_DATA'
        ? 'intake'
        : 'assessed';

  const { data: insertedDevice, error: insertError } = await supabase
    .from('devices')
    .insert({
      asset_tag: input.assetTag,
      category: input.category,
      brand: input.brand,
      model: input.model,
      ram_gb: input.ramGb ?? null,
      storage_gb: input.storageGb ?? null,
      boots: input.boots ?? null,
      condition: input.condition,
      battery_safety: input.batterySafety,
      storage_present: input.storagePresent,
      repairable: input.repairable ?? null,
      charger_included: input.chargerIncluded ?? null,
      parts_cost_cents: input.partsCostCents ?? null,
      estimated_labor_minutes: input.estimatedLaborMinutes ?? null,
      comparable_value_cents: input.comparableValueCents ?? null,
      sanitization_status: sanitizationStatus,
      status: initialStatus,
      created_by: auth.actor.id,
    })
    .select('id')
    .single();

  if (insertError || !insertedDevice) {
    const isDuplicate = insertError?.code === '23505';
    return {
      ok: false,
      code: isDuplicate ? 'CONFLICT' : 'INTERNAL',
      message: isDuplicate
        ? `Asset tag '${input.assetTag}' already exists.`
        : 'Could not insert device record.',
    };
  }

  await supabase.from('assessments').insert({
    device_id: insertedDevice.id,
    input_snapshot: input,
    config_snapshot: config,
    decision: evalResult.decision,
    rule_version: evalResult.ruleVersion,
    reason_codes: evalResult.reasonCodes,
    reason_details: evalResult.reasonDetails,
    missing_fields: evalResult.missingFields,
    cost_breakdown: evalResult.costBreakdown,
    repair_cost_cents: evalResult.repairCostCents,
    margin_cents: evalResult.marginCents,
    sanitization_gate_open: evalResult.sanitizationGateOpen,
    assessed_by: auth.actor.id,
    assessed_by_name: auth.actor.name,
  });

  await supabase.from('workflow_events').insert({
    device_id: insertedDevice.id,
    from_status: null,
    to_status: initialStatus,
    actor_id: auth.actor.id,
    actor_name: auth.actor.name,
    actor_role: auth.actor.role,
    note: `Initial intake and v${evalResult.ruleVersion} assessment (${evalResult.decision}).`,
  });

  const fullRes = await getDeviceServerAction(insertedDevice.id);
  if (!fullRes.ok || !fullRes.data) {
    return { ok: false, code: 'INTERNAL', message: 'Device created but reload failed.' };
  }
  return { ok: true, data: fullRes.data };
}

export async function updateDeviceIntakeServerAction(
  id: string,
  rawInput: unknown
): Promise<ActionResponse<Device>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  if (auth.actor.role === 'viewer') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Viewer role cannot edit device intake fields.',
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

  const currentRes = await getDeviceServerAction(id);
  if (!currentRes.ok || !currentRes.data) {
    return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
  }

  const existing = currentRes.data;
  if (
    auth.actor.role === 'technician' &&
    existing.status !== 'intake' &&
    existing.status !== 'assessed'
  ) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Technicians can only edit intake fields while device is in intake or assessed status.',
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, code: 'FAILED_DEPENDENCY', message: 'Supabase not configured.' };
  }

  const updates = parsed.data;
  const updatedStoragePresent = updates.storagePresent ?? existing.storagePresent;
  let updatedSanitization = existing.sanitizationStatus;
  if (updatedStoragePresent && existing.sanitizationStatus === 'not_applicable') {
    updatedSanitization = 'pending';
  } else if (!updatedStoragePresent) {
    updatedSanitization = 'not_applicable';
  }

  const { error } = await supabase
    .from('devices')
    .update({
      category: updates.category ?? existing.category,
      brand: updates.brand ?? existing.brand,
      model: updates.model ?? existing.model,
      ram_gb: updates.ramGb !== undefined ? updates.ramGb : existing.ramGb,
      storage_gb: updates.storageGb !== undefined ? updates.storageGb : existing.storageGb,
      boots: updates.boots !== undefined ? updates.boots : existing.boots,
      condition: updates.condition ?? existing.condition,
      battery_safety: updates.batterySafety ?? existing.batterySafety,
      storage_present: updatedStoragePresent,
      repairable: updates.repairable !== undefined ? updates.repairable : existing.repairable,
      charger_included:
        updates.chargerIncluded !== undefined
          ? updates.chargerIncluded
          : existing.chargerIncluded,
      parts_cost_cents:
        updates.partsCostCents !== undefined
          ? updates.partsCostCents
          : existing.partsCostCents,
      estimated_labor_minutes:
        updates.estimatedLaborMinutes !== undefined
          ? updates.estimatedLaborMinutes
          : existing.estimatedLaborMinutes,
      comparable_value_cents:
        updates.comparableValueCents !== undefined
          ? updates.comparableValueCents
          : existing.comparableValueCents,
      sanitization_status: updatedSanitization,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { ok: false, code: 'INTERNAL', message: 'Failed to update device intake fields.' };
  }

  const reloaded = await getDeviceServerAction(id);
  if (!reloaded.ok || !reloaded.data) {
    return { ok: false, code: 'INTERNAL', message: 'Failed to reload updated device.' };
  }
  return { ok: true, data: reloaded.data };
}

export async function assessDeviceServerAction(
  id: string
): Promise<ActionResponse<{ device: Device; assessment: AssessmentRecord }>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Authentication required.' };
  }
  if (auth.actor.role === 'viewer') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Viewer role cannot trigger assessments.',
    };
  }

  const currentRes = await getDeviceServerAction(id);
  if (!currentRes.ok || !currentRes.data) {
    return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
  }

  const existing = currentRes.data;
  const config = await getEngineConfigServerAction();
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

  const evalResult = evaluateDevice(inputSnapshot, config, existing.sanitizationStatus);
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, code: 'FAILED_DEPENDENCY', message: 'Supabase not configured.' };
  }

  const { error } = await supabase.from('assessments').insert({
    device_id: existing.id,
    input_snapshot: inputSnapshot,
    config_snapshot: config,
    decision: evalResult.decision,
    rule_version: evalResult.ruleVersion,
    reason_codes: evalResult.reasonCodes,
    reason_details: evalResult.reasonDetails,
    missing_fields: evalResult.missingFields,
    cost_breakdown: evalResult.costBreakdown,
    repair_cost_cents: evalResult.repairCostCents,
    margin_cents: evalResult.marginCents,
    sanitization_gate_open: evalResult.sanitizationGateOpen,
    assessed_by: auth.actor.id,
    assessed_by_name: auth.actor.name,
  });

  if (error) {
    return { ok: false, code: 'INTERNAL', message: 'Could not save assessment snapshot.' };
  }

  let nextStatus: WorkflowStatus = existing.status;
  let statusNote: string | null = null;

  if (evalResult.decision === 'QUARANTINE' && existing.status !== 'quarantined') {
    nextStatus = 'quarantined';
    statusNote = 'Safety quarantine triggered during assessment (swollen battery).';
  } else if (existing.status === 'intake' && evalResult.decision !== 'INSUFFICIENT_DATA') {
    nextStatus = 'assessed';
    statusNote = `Re-assessed with rule v${evalResult.ruleVersion}: ${evalResult.decision}.`;
  }

  if (nextStatus !== existing.status && statusNote) {
    await supabase
      .from('devices')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    await supabase.from('workflow_events').insert({
      device_id: existing.id,
      from_status: existing.status,
      to_status: nextStatus,
      actor_id: auth.actor.id,
      actor_name: auth.actor.name,
      actor_role: auth.actor.role,
      note: statusNote,
    });
  }

  const reloaded = await getDeviceServerAction(id);
  if (!reloaded.ok || !reloaded.data || !reloaded.data.latestAssessment) {
    return { ok: false, code: 'INTERNAL', message: 'Failed to reload assessed device.' };
  }

  return {
    ok: true,
    data: {
      device: reloaded.data,
      assessment: reloaded.data.latestAssessment,
    },
  };
}

export async function transitionDeviceServerAction(
  rawInput: unknown
): Promise<ActionResponse<{ device: Device; event: WorkflowEvent }>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  const parsed = transitionDeviceSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: parsed.error.issues.map((i) => i.message).join(' '),
    };
  }

  const input = parsed.data;
  const currentRes = await getDeviceServerAction(input.deviceId);
  if (!currentRes.ok || !currentRes.data) {
    return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
  }

  const guardCheck = validateWorkflowTransition({
    device: currentRes.data,
    expectedStatus: input.expectedStatus,
    nextStatus: input.nextStatus,
    actorRole: auth.actor.role,
    note: input.note,
    disposition: input.disposition,
  });

  if (!guardCheck.ok) {
    return guardCheck;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, code: 'FAILED_DEPENDENCY', message: 'Supabase not configured.' };
  }

  const { error } = await supabase.rpc('transition_device_status', {
    p_device_id: input.deviceId,
    p_expected_status: input.expectedStatus,
    p_next_status: input.nextStatus,
    p_note: input.note.trim(),
    p_disposition: input.disposition ?? null,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('CONFLICT')) {
      return { ok: false, code: 'CONFLICT', message: msg };
    }
    if (msg.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: msg };
    }
    return {
      ok: false,
      code: 'VALIDATION',
      message: 'Transition rejected by server database policy.',
    };
  }

  const reloaded = await getDeviceServerAction(input.deviceId);
  if (!reloaded.ok || !reloaded.data) {
    return { ok: false, code: 'INTERNAL', message: 'Transition succeeded but reload failed.' };
  }

  const latestEvent =
    reloaded.data.workflowEvents[reloaded.data.workflowEvents.length - 1]!;
  return { ok: true, data: { device: reloaded.data, event: latestEvent } };
}

export async function verifySanitizationServerAction(
  rawInput: unknown
): Promise<ActionResponse<Device>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  const parsed = verifySanitizationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: parsed.error.issues.map((i) => i.message).join(' '),
    };
  }

  const input = parsed.data;
  const currentRes = await getDeviceServerAction(input.deviceId);
  if (!currentRes.ok || !currentRes.data) {
    return { ok: false, code: 'VALIDATION', message: 'Device not found.' };
  }

  const check = validateSanitizationUpdate({
    device: currentRes.data,
    newStatus: input.status,
    actorRole: auth.actor.role,
    note: input.note,
  });

  if (!check.ok) {
    return check;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, code: 'FAILED_DEPENDENCY', message: 'Supabase not configured.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('devices')
    .update({
      sanitization_status: input.status,
      sanitization_verified_by: auth.actor.id,
      sanitization_verified_at: now,
      sanitization_note: input.note.trim(),
      updated_at: now,
    })
    .eq('id', input.deviceId);

  if (error) {
    return {
      ok: false,
      code: 'INTERNAL',
      message: 'Could not update sanitization verification status.',
    };
  }

  await supabase.from('workflow_events').insert({
    device_id: input.deviceId,
    from_status: currentRes.data.status,
    to_status: currentRes.data.status,
    actor_id: auth.actor.id,
    actor_name: auth.actor.name,
    actor_role: auth.actor.role,
    note: `[External Sanitization Recorded: ${input.status.toUpperCase()}] ${input.note.trim()}`,
  });

  const reloaded = await getDeviceServerAction(input.deviceId);
  if (!reloaded.ok || !reloaded.data) {
    return { ok: false, code: 'INTERNAL', message: 'Failed to reload device.' };
  }
  return { ok: true, data: reloaded.data };
}

export async function updateEngineConfigServerAction(
  rawConfig: unknown
): Promise<ActionResponse<EngineConfig>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Authentication required.' };
  }

  if (auth.actor.role !== 'manager') {
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, code: 'FAILED_DEPENDENCY', message: 'Supabase not configured.' };
  }

  const cfg = parsed.data;
  const { error } = await supabase
    .from('assumption_settings')
    .update({
      hourly_rate_cents: cfg.hourlyRateCents,
      min_margin_cents: cfg.minMarginCents,
      min_laptop_ram_gb: cfg.minLaptopRamGb,
      overhead_cents: cfg.overheadCents,
      baseline_minutes: cfg.baselineMinutes,
      target_minutes: cfg.targetMinutes,
      updated_by: auth.actor.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) {
    return { ok: false, code: 'INTERNAL', message: 'Could not save assumption settings.' };
  }

  return { ok: true, data: cfg };
}
