import {
  ActionResponse,
  Device,
  Disposition,
  SanitizationStatus,
  UserRole,
  WorkflowStatus,
} from '@/types/domain';

/**
 * Permitted workflow transitions (ReuseFlow_PRD.md §7.1):
 * intake -> assessed | quarantined
 * assessed -> approved_refurb | recycle_review | quarantined | intake
 * approved_refurb -> repairing | assessed
 * repairing -> ready | assessed | quarantined
 * recycle_review -> assessed | closed
 * ready -> closed | assessed
 * quarantined -> assessed (manager only after safety review)
 * closed -> terminal (cannot reopen through MVP UI)
 */
export const ALLOWED_WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  intake: ['assessed', 'quarantined'],
  assessed: ['approved_refurb', 'recycle_review', 'quarantined', 'intake'],
  approved_refurb: ['repairing', 'assessed'],
  repairing: ['ready', 'assessed', 'quarantined'],
  recycle_review: ['assessed', 'closed'],
  ready: ['closed', 'assessed'],
  quarantined: ['assessed'],
  closed: [],
};

/**
 * Transitions that strictly require 'manager' role (ReuseFlow_PRD.md §7.1):
 * - Approving refurbishment (to 'approved_refurb')
 * - Routing to recycle review (to 'recycle_review')
 * - Marking device 'ready'
 * - Releasing from 'quarantined' (from 'quarantined' to 'assessed')
 * - Closing a device record (to 'closed')
 */
export function isManagerRequiredForTransition(
  fromStatus: WorkflowStatus,
  toStatus: WorkflowStatus
): boolean {
  if (fromStatus === 'quarantined') return true;
  if (
    toStatus === 'approved_refurb' ||
    toStatus === 'recycle_review' ||
    toStatus === 'ready' ||
    toStatus === 'closed'
  ) {
    return true;
  }
  return false;
}

export function validateWorkflowTransition(params: {
  device: Pick<
    Device,
    'status' | 'storagePresent' | 'sanitizationStatus' | 'batterySafety'
  > & {
    latestAssessment?: { decision?: string } | null;
  };
  expectedStatus: WorkflowStatus;
  nextStatus: WorkflowStatus;
  actorRole: UserRole;
  note: string;
  disposition?: Disposition | null;
}): ActionResponse<{ allowed: true }> {
  const { device, expectedStatus, nextStatus, actorRole, note, disposition } = params;

  // 1. Optimistic concurrency check
  if (device.status !== expectedStatus) {
    return {
      ok: false,
      code: 'CONFLICT',
      message: `Stale workflow state: expected '${expectedStatus}', but device is currently '${device.status}'. Please refresh and review the latest history.`,
    };
  }

  // 2. Role check: viewers cannot transition anything
  if (actorRole === 'viewer') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Viewer role is read-only and cannot modify device workflow states.',
    };
  }

  // 3. Check transition matrix
  const allowedNext = ALLOWED_WORKFLOW_TRANSITIONS[device.status] ?? [];
  if (!allowedNext.includes(nextStatus)) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: `Transition from '${device.status}' to '${nextStatus}' is not permitted by workflow rules.`,
    };
  }

  // 4. Manager authorization check for protected states
  if (isManagerRequiredForTransition(device.status, nextStatus) && actorRole !== 'manager') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: `Transition from '${device.status}' to '${nextStatus}' requires Refurbishment Manager approval.`,
    };
  }

  // 5. Safety guard: Swollen battery cannot move to approved_refurb, repairing, or ready
  if (
    device.batterySafety === 'swollen' &&
    (nextStatus === 'approved_refurb' || nextStatus === 'repairing' || nextStatus === 'ready')
  ) {
    return {
      ok: false,
      code: 'VALIDATION',
      message:
        'Safety gate locked: Device has a swollen battery hazard and must remain quarantined or undergo safety review.',
    };
  }

  // 5b. Missing critical inputs guard: INSUFFICIENT_DATA cannot move to approved_refurb, repairing, or ready
  if (
    device.latestAssessment?.decision === 'INSUFFICIENT_DATA' &&
    (nextStatus === 'approved_refurb' || nextStatus === 'repairing' || nextStatus === 'ready')
  ) {
    return {
      ok: false,
      code: 'VALIDATION',
      message:
        'Missing critical inputs gate locked: Complete all required intake and cost fields and re-evaluate before approving refurbishment.',
    };
  }

  // 6. Data sanitization gate: storage-bearing devices cannot reach 'ready' or 'closed' until sanitization is verified
  if (
    device.storagePresent &&
    device.sanitizationStatus !== 'verified' &&
    (nextStatus === 'ready' || nextStatus === 'closed')
  ) {
    return {
      ok: false,
      code: 'VALIDATION',
      message:
        'Data sanitization gate locked: Storage-bearing device cannot be marked ready or closed until external sanitization is human-verified by a manager.',
    };
  }

  // 7. Disposition requirement on closure
  if (nextStatus === 'closed' && !disposition) {
    return {
      ok: false,
      code: 'VALIDATION',
      message:
        'Closing a device requires recording an authorized disposition (distributed, recycled, or other_authorized).',
    };
  }

  // 8. Non-empty note requirement
  if (!note || note.trim().length < 3) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: 'Every workflow state transition requires an audit note (at least 3 characters).',
    };
  }

  return { ok: true, data: { allowed: true } };
}

export function validateSanitizationUpdate(params: {
  device: Pick<Device, 'storagePresent'>;
  newStatus: SanitizationStatus;
  actorRole: UserRole;
  note: string;
}): ActionResponse<{ allowed: true }> {
  const { device, newStatus, actorRole, note } = params;

  if (actorRole !== 'manager') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message:
        'Only a Refurbishment Manager can verify or override external data sanitization status.',
    };
  }

  if (device.storagePresent && newStatus === 'not_applicable') {
    return {
      ok: false,
      code: 'VALIDATION',
      message:
        'Cannot mark sanitization as not_applicable while storage media is present on the device.',
    };
  }

  if (!note || note.trim().length < 5) {
    return {
      ok: false,
      code: 'VALIDATION',
      message:
        'Please record the external sanitization method/reference in the verification note (min 5 characters).',
    };
  }

  return { ok: true, data: { allowed: true } };
}
