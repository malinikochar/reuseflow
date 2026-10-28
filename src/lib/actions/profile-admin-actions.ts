'use server';

import { z } from 'zod';
import {
  ActionResponse,
  AdminSystemOverview,
  EmailEventRecord,
  UserProfile,
  UserRole,
} from '@/types/domain';
import { userRoleSchema } from '@/lib/validation/schemas';
import { getVerifiedServerActor } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const updateOwnProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(80, 'Display name must be 80 characters or fewer.'),
  department: z
    .string()
    .trim()
    .min(2, 'Department must be at least 2 characters.')
    .max(80, 'Department must be 80 characters or fewer.'),
  jobTitle: z
    .string()
    .trim()
    .min(2, 'Job title must be at least 2 characters.')
    .max(80, 'Job title must be 80 characters or fewer.'),
});

const adminUpdateProfileSchema = z.object({
  targetUserId: z.string().uuid('Valid target user UUID is required.'),
  newRole: userRoleSchema,
  displayName: z.string().trim().min(2).max(80).optional(),
  department: z.string().trim().min(2).max(80).optional(),
  jobTitle: z.string().trim().min(2).max(80).optional(),
});

interface DbProfileRow {
  id: string;
  email: string | null;
  display_name: string;
  department: string | null;
  job_title: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface DbEmailEventRow {
  id: string;
  type: string;
  recipient: string;
  provider_id: string | null;
  idempotency_key: string;
  status: 'sent' | 'failed' | 'skipped';
  sent_by: string;
  created_at: string;
}

function mapProfileRow(row: DbProfileRow, fallbackEmail = ''): UserProfile {
  return {
    id: row.id,
    email: row.email || fallbackEmail || 'staff@reuseflow.org',
    displayName: row.display_name,
    department: row.department || 'Refurbishment Operations',
    jobTitle: row.job_title || 'Refurbishment Specialist',
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMyProfileServerAction(): Promise<ActionResponse<UserProfile>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required to load profile.',
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

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, department, job_title, role, created_at, updated_at')
    .eq('id', auth.actor.id)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: true,
      data: {
        id: auth.actor.id,
        email: auth.email || 'staff@reuseflow.org',
        displayName: auth.actor.name,
        department: 'Refurbishment Operations',
        jobTitle: 'Operations Specialist',
        role: auth.actor.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  return {
    ok: true,
    data: mapProfileRow(data as unknown as DbProfileRow, auth.email),
  };
}

export async function updateMyProfileServerAction(
  rawInput: unknown
): Promise<ActionResponse<UserProfile>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Please sign in to update your profile.',
    };
  }

  const parsed = updateOwnProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: parsed.error.issues.map((i) => i.message).join(' '),
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

  const { displayName, department, jobTitle } = parsed.data;
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      department,
      job_title: jobTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.actor.id)
    .select('id, email, display_name, department, job_title, role, created_at, updated_at')
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: 'INTERNAL',
      message: error?.message || 'Failed to update profile.',
    };
  }

  return {
    ok: true,
    data: mapProfileRow(data as unknown as DbProfileRow, auth.email),
  };
}

export async function getAdminSystemOverviewServerAction(): Promise<
  ActionResponse<AdminSystemOverview>
> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required to view system governance.',
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

  const [profilesRes, devicesCountRes, assessmentsCountRes, eventsCountRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, display_name, department, job_title, role, created_at, updated_at')
        .order('created_at', { ascending: true }),
      supabase.from('devices').select('id', { count: 'exact', head: true }),
      supabase.from('assessments').select('id', { count: 'exact', head: true }),
      supabase.from('workflow_events').select('id', { count: 'exact', head: true }),
    ]);

  const profiles = ((profilesRes.data as unknown as DbProfileRow[]) ?? []).map((p) =>
    mapProfileRow(p)
  );

  let emailEvents: EmailEventRecord[] = [];
  if (auth.actor.role === 'manager') {
    const emailRes = await supabase
      .from('email_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);

    emailEvents = ((emailRes.data as unknown as DbEmailEventRow[]) ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      recipient: e.recipient,
      providerId: e.provider_id,
      idempotencyKey: e.idempotency_key,
      status: e.status,
      sentBy: e.sent_by,
      createdAt: e.created_at,
    }));
  }

  return {
    ok: true,
    data: {
      profiles,
      emailEvents,
      counts: {
        users: profiles.length,
        devices: devicesCountRes.count ?? 0,
        assessments: assessmentsCountRes.count ?? 0,
        workflowEvents: eventsCountRes.count ?? 0,
        emailEvents: emailEvents.length,
      },
    },
  };
}

export async function adminUpdateUserProfileServerAction(
  rawInput: unknown
): Promise<ActionResponse<UserProfile>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    };
  }

  if (auth.actor.role !== 'manager') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Only an Admin / Refurbishment Manager can modify user roles.',
    };
  }

  const parsed = adminUpdateProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: parsed.error.issues.map((i) => i.message).join(' '),
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
  const { data, error } = await supabase.rpc('admin_update_user_profile', {
    p_target_user_id: input.targetUserId,
    p_new_role: input.newRole,
    p_display_name: input.displayName ?? null,
    p_department: input.department ?? null,
    p_job_title: input.jobTitle ?? null,
  });

  if (error || !data) {
    return {
      ok: false,
      code: error?.message?.includes('FORBIDDEN') ? 'FORBIDDEN' : 'INTERNAL',
      message: error?.message || 'Could not update staff role.',
    };
  }

  return {
    ok: true,
    data: mapProfileRow(data as unknown as DbProfileRow),
  };
}
