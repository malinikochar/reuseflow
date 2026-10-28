'use client';

import React, { useMemo } from 'react';
import { Device, EngineConfig } from '@/types/domain';
import { ActorContext } from '@/lib/repositories/types';
import { SupabaseDeviceRepository } from '@/lib/repositories/supabase-repository';
import { OperationsWorkspace } from '@/components/layout/operations-workspace';

export function AuthenticatedClientWorkspace({
  actor,
  initialDevices,
  initialConfig,
}: {
  actor: ActorContext;
  initialDevices?: Device[];
  initialConfig?: EngineConfig;
}) {
  const repo = useMemo(() => new SupabaseDeviceRepository(), []);

  return (
    <OperationsWorkspace
      repository={repo}
      isDemo={false}
      fixedActor={actor}
      initialDevices={initialDevices}
      initialConfig={initialConfig}
    />
  );
}
