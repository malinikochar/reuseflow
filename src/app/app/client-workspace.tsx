'use client';

import React, { useMemo } from 'react';
import { ActorContext } from '@/lib/repositories/types';
import { SupabaseDeviceRepository } from '@/lib/repositories/supabase-repository';
import { OperationsWorkspace } from '@/components/layout/operations-workspace';

export function AuthenticatedClientWorkspace({ actor }: { actor: ActorContext }) {
  const repo = useMemo(() => new SupabaseDeviceRepository(), []);

  return <OperationsWorkspace repository={repo} isDemo={false} fixedActor={actor} />;
}
