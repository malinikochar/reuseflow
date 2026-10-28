'use server';

import crypto from 'node:crypto';
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
import {
  sendPasswordChangedNoticeEmail,
  sendPasswordResetCodeEmail,
  sendRegistrationWelcomeEmail,
} from '@/lib/email/auth-email-service';

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
  phone: z.string().trim().max(40, 'Phone must be 40 characters or fewer.').optional(),
  location: z
    .string()
    .trim()
    .max(80, 'Facility location must be 80 characters or fewer.')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(300, 'Bio / notes must be 300 characters or fewer.')
    .optional(),
});

const adminUpdateProfileSchema = z.object({
  targetUserId: z.string().uuid('Valid target user UUID is required.'),
  newRole: userRoleSchema,
  displayName: z.string().trim().min(2).max(80).optional(),
  department: z.string().trim().min(2).max(80).optional(),
  jobTitle: z.string().trim().min(2).max(80).optional(),
});

const welcomeEmailSchema = z.object({
  email: z.string().trim().email('Valid email address is required.'),
  displayName: z.string().trim().min(2).max(80),
  department: z.string().trim().min(2).max(80).default('Refurbishment Operations'),
  jobTitle: z.string().trim().min(2).max(80).default('Refurbishment Specialist'),
  role: userRoleSchema.default('technician'),
});

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email('Enter a valid account email address.'),
});

const resetPasswordWithCodeSchema = z.object({
  email: z.string().trim().email('Enter a valid account email address.'),
  code: z
    .string()
    .trim()
    .min(6, 'Enter the 6-digit recovery code sent to your email.')
    .max(12),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters.')
    .max(128),
});

const changeOwnPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters.')
    .max(128),
});

interface DbProfileRow {
  id: string;
  email: string | null;
  display_name: string;
  department: string | null;
  job_title: string | null;
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
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
    phone: row.phone ?? '',
    location: row.location || 'Main Refurbishment Bench',
    bio: row.bio ?? '',
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
    .select(
      'id, email, display_name, department, job_title, phone, location, bio, role, created_at, updated_at'
    )
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
        phone: '',
        location: 'Main Refurbishment Bench',
        bio: '',
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

  const { displayName, department, jobTitle, phone, location, bio } = parsed.data;
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      department,
      job_title: jobTitle,
      phone: phone ?? '',
      location: location || 'Main Refurbishment Bench',
      bio: bio ?? '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.actor.id)
    .select(
      'id, email, display_name, department, job_title, phone, location, bio, role, created_at, updated_at'
    )
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

export async function changeMyPasswordServerAction(
  rawInput: unknown
): Promise<ActionResponse<{ updated: boolean }>> {
  const auth = await getVerifiedServerActor();
  if (auth.status !== 'authenticated') {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Please sign in to change your password.',
    };
  }

  const parsed = changeOwnPasswordSchema.safeParse(rawInput);
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

  const { error } = await supabase.rpc('change_own_password', {
    p_new_password: parsed.data.newPassword,
  });

  if (error) {
    return {
      ok: false,
      code: 'INTERNAL',
      message: error.message || 'Could not update password.',
    };
  }

  if (auth.email) {
    void sendPasswordChangedNoticeEmail({
      email: auth.email,
      displayName: auth.actor.name,
    });
  }

  return { ok: true, data: { updated: true } };
}

export async function sendWelcomeEmailOnRegisterServerAction(
  rawInput: unknown
): Promise<ActionResponse<{ sent: boolean; providerId?: string }>> {
  const parsed = welcomeEmailSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: parsed.error.issues.map((i) => i.message).join(' '),
    };
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase.rpc('ensure_user_workspace_seeded', {
        p_user_id: user.id,
      });
    }
  }

  const emailRes = await sendRegistrationWelcomeEmail(parsed.data);
  if (!emailRes.ok) {
    return {
      ok: false,
      code: 'FAILED_DEPENDENCY',
      message: emailRes.message || 'Could not deliver welcome email.',
    };
  }

  return {
    ok: true,
    data: { sent: true, providerId: emailRes.providerId },
  };
}

export async function requestPasswordResetServerAction(
  rawInput: unknown
): Promise<ActionResponse<{ delivered: boolean; email: string }>> {
  const parsed = requestPasswordResetSchema.safeParse(rawInput);
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
      message: 'Supabase is not configured.',
    };
  }

  const cleanEmail = parsed.data.email.trim().toLowerCase();
  const recoveryCode = String(crypto.randomInt(100000, 999999));

  const { data, error } = await supabase.rpc('issue_password_reset_code', {
    p_email: cleanEmail,
    p_code: recoveryCode,
  });

  if (error) {
    return {
      ok: false,
      code: 'INTERNAL',
      message: 'Unable to generate password recovery code right now.',
    };
  }

  const rpcPayload = (data as { found?: boolean; display_name?: string } | null) ?? {};
  if (!rpcPayload.found) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: `No registered ReuseFlow account was found for '${cleanEmail}'. Please check the email address or create a new account.`,
    };
  }

  const emailRes = await sendPasswordResetCodeEmail({
    email: cleanEmail,
    displayName: rpcPayload.display_name || 'Staff Member',
    code: recoveryCode,
  });

  if (!emailRes.ok) {
    return {
      ok: false,
      code: 'FAILED_DEPENDENCY',
      message: emailRes.message || 'Failed to deliver recovery email via Resend.',
    };
  }

  return {
    ok: true,
    data: { delivered: true, email: cleanEmail },
  };
}

export async function resetPasswordWithCodeServerAction(
  rawInput: unknown
): Promise<ActionResponse<{ reset: boolean }>> {
  const parsed = resetPasswordWithCodeSchema.safeParse(rawInput);
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
      message: 'Supabase is not configured.',
    };
  }

  const cleanEmail = parsed.data.email.trim().toLowerCase();
  const cleanCode = parsed.data.code.trim();

  const { error } = await supabase.rpc('reset_password_with_code', {
    p_email: cleanEmail,
    p_code: cleanCode,
    p_new_password: parsed.data.newPassword,
  });

  if (error) {
    return {
      ok: false,
      code: 'VALIDATION',
      message:
        error.message?.includes('INVALID_CODE')
          ? 'Invalid or expired 6-digit recovery code. Please request a new code.'
          : error.message || 'Could not reset password.',
    };
  }

  void sendPasswordChangedNoticeEmail({
    email: cleanEmail,
    displayName: cleanEmail.split('@')[0] || 'Staff Member',
  });

  return { ok: true, data: { reset: true } };
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

  const [profilesRes, emailRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, email, display_name, department, job_title, phone, location, bio, role, created_at, updated_at'
      )
      .order('created_at', { ascending: true }),
    auth.actor.role === 'manager'
      ? supabase
          .from('email_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25)
      : Promise.resolve({ data: [] }),
  ]);

  const profiles = ((profilesRes.data as unknown as DbProfileRow[]) ?? []).map((p) =>
    mapProfileRow(p)
  );

  const emailEvents: EmailEventRecord[] = (
    (emailRes.data as unknown as DbEmailEventRow[]) ?? []
  ).map((e) => ({
    id: e.id,
    type: e.type,
    recipient: e.recipient,
    providerId: e.provider_id,
    idempotencyKey: e.idempotency_key,
    status: e.status,
    sentBy: e.sent_by,
    createdAt: e.created_at,
  }));

  return {
    ok: true,
    data: {
      profiles,
      emailEvents,
      counts: {
        users: profiles.length,
        devices: 0,
        assessments: 0,
        workflowEvents: 0,
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
