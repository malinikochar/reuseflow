import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { ActorContext } from '@/lib/repositories/types';
import { UserRole } from '@/types/domain';
import { userRoleSchema } from '@/lib/validation/schemas';

export type ServerAuthResolution =
  | { status: 'unconfigured' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; actor: ActorContext; email?: string };

/**
 * Verifies user identity on the server via supabase.auth.getUser() (never getSession().user)
 * and resolves the authoritative role from public.profiles.
 */
export async function getVerifiedServerActor(): Promise<ServerAuthResolution> {
  const { isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) {
    return { status: 'unconfigured' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: 'unconfigured' };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: 'unauthenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const parsedRole = userRoleSchema.safeParse(profile?.role);
  const role: UserRole = parsedRole.success ? parsedRole.data : 'viewer';
  const name =
    profile?.display_name?.trim() ||
    user.email?.split('@')[0] ||
    'Authenticated Staff';

  return {
    status: 'authenticated',
    actor: {
      id: user.id,
      name,
      role,
    },
    email: user.email,
  };
}
