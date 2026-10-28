'use client';

import React, { useMemo } from 'react';
import { DemoDeviceRepository } from '@/lib/repositories/demo-repository';
import { OperationsWorkspace } from '@/components/layout/operations-workspace';

export default function DemoSandboxPage() {
  const demoRepo = useMemo(() => new DemoDeviceRepository(), []);

  return (
    <OperationsWorkspace
      repository={demoRepo}
      isDemo={true}
      onResetDemo={() => demoRepo.resetDemo()}
    />
  );
}
