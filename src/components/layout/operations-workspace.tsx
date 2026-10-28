'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Calculator,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Lock,
  PlusCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  Device,
  DeviceFilters,
  Disposition,
  EngineConfig,
  SanitizationStatus,
  UserRole,
  WorkflowStatus,
} from '@/types/domain';
import { DEFAULT_ENGINE_CONFIG } from '@/lib/decision/engine';
import { ActorContext, DeviceRepository } from '@/lib/repositories/types';
import { DeviceCreateInput } from '@/lib/validation/schemas';
import {
  DemoModeBanner,
  ErrorState,
  LoadingSkeleton,
  WorkflowStatusBadge,
} from '@/components/shared/badges-and-banners';
import {
  OperationsDashboardOverview,
  ScenarioLab,
} from '@/components/analytics/scenario-lab';
import { EmailSummaryPanel } from '@/components/analytics/email-summary-card';
import {
  CsvExportButton,
  DeviceFiltersBar,
  DeviceTable,
} from '@/components/devices/device-table-and-filters';
import { DeviceIntakeForm } from '@/components/devices/device-intake-form';
import { AssessmentPanel } from '@/components/assessments/assessment-panel';
import {
  WorkflowDecisionControls,
  WorkflowTimeline,
} from '@/components/devices/workflow-timeline-and-dialogs';
import { cn } from '@/lib/utils';

type WorkspaceTab = 'inventory' | 'intake' | 'scenario';

const DEMO_ACTORS: Record<UserRole, ActorContext> = {
  manager: {
    id: 'demo-mgr-1',
    name: 'Morgan Chen (Sample Manager)',
    role: 'manager',
  },
  technician: {
    id: 'demo-tech-1',
    name: 'Alex Rivera (Sample Tech)',
    role: 'technician',
  },
  viewer: {
    id: 'demo-view-1',
    name: 'Jordan Lee (Sample Analyst)',
    role: 'viewer',
  },
};

export function OperationsWorkspace({
  repository,
  isDemo,
  fixedActor,
  onResetDemo,
}: {
  repository: DeviceRepository;
  isDemo: boolean;
  fixedActor?: ActorContext;
  onResetDemo?: () => Promise<Device[]>;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('inventory');
  const [demoRole, setDemoRole] = useState<UserRole>('manager');
  const activeActor: ActorContext = fixedActor ?? DEMO_ACTORS[demoRole];

  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeviceFilters>({
    search: '',
    category: 'all',
    decision: 'all',
    status: 'all',
  });
  const [engineConfig, setEngineConfig] = useState<EngineConfig>(DEFAULT_ENGINE_CONFIG);

  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  const loadWorkspaceData = useCallback(
    async (preferredSelectedId?: string) => {
      try {
        setError(null);
        const [fullList, filteredList, cfg] = await Promise.all([
          repository.list(),
          repository.list(filters),
          repository.getEngineConfig(),
        ]);

        setAllDevices(fullList);
        setFilteredDevices(filteredList);
        setEngineConfig(cfg);

        setSelectedDeviceId((prev) => {
          const targetId = preferredSelectedId ?? prev;
          if (targetId && fullList.some((d) => d.id === targetId)) {
            return targetId;
          }
          return filteredList[0]?.id ?? fullList[0]?.id ?? null;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load device inventory.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [repository, filters]
  );

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  const selectedDevice =
    allDevices.find((d) => d.id === selectedDeviceId) ?? filteredDevices[0] ?? null;

  const handleResetDemo = async () => {
    if (!onResetDemo) return;
    setIsBusy(true);
    try {
      const fresh = await onResetDemo();
      setFilters({ search: '', category: 'all', decision: 'all', status: 'all' });
      setAllDevices(fresh);
      setFilteredDevices(fresh);
      setSelectedDeviceId(fresh[0]?.id ?? null);
      setEngineConfig(await repository.getEngineConfig());
      setActiveTab('inventory');
      setToastMessage('Demo sandbox reset to the 6 canonical PRD fictional fixtures.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateDevice = async (input: DeviceCreateInput) => {
    setIsBusy(true);
    setToastMessage(null);
    try {
      const res = await repository.create(input, activeActor);
      if (!res.ok) {
        return { ok: false, message: res.message };
      }

      const created = res.data;
      setFilters({ search: '', category: 'all', decision: 'all', status: 'all' });
      await loadWorkspaceData(created.id);
      setSelectedDeviceId(created.id);
      setActiveTab('inventory');
      setToastMessage(
        `Created ${created.assetTag} (${created.brand} ${created.model}) and ran v1.0.0 assessment: ${created.latestAssessment?.decision}.`
      );
      setTimeout(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return { ok: true };
    } finally {
      setIsBusy(false);
    }
  };

  const handleRunAssessment = async () => {
    if (!selectedDevice) return;
    setIsBusy(true);
    setToastMessage(null);
    try {
      const res = await repository.assessDevice(
        selectedDevice.id,
        activeActor,
        engineConfig
      );
      if (res.ok) {
        await loadWorkspaceData(selectedDevice.id);
        setToastMessage(
          `Re-evaluated ${selectedDevice.assetTag}: ${res.data.assessment.decision} (Rule v${res.data.assessment.ruleVersion}).`
        );
      } else {
        setError(res.message);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleTransition = async (params: {
    nextStatus: WorkflowStatus;
    note: string;
    disposition?: Disposition | null;
  }) => {
    if (!selectedDevice) return { ok: false, message: 'No device selected.' };
    setIsBusy(true);
    try {
      const res = await repository.transition(
        {
          deviceId: selectedDevice.id,
          expectedStatus: selectedDevice.status,
          nextStatus: params.nextStatus,
          note: params.note,
          disposition: params.disposition,
        },
        activeActor
      );
      if (res.ok) {
        await loadWorkspaceData(selectedDevice.id);
        setToastMessage(
          `Updated ${selectedDevice.assetTag} status to '${params.nextStatus}'. Audit event recorded.`
        );
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifySanitization = async (params: {
    status: SanitizationStatus;
    note: string;
  }) => {
    if (!selectedDevice) return { ok: false, message: 'No device selected.' };
    setIsBusy(true);
    try {
      const res = await repository.verifySanitization(
        {
          deviceId: selectedDevice.id,
          status: params.status,
          note: params.note,
        },
        activeActor
      );
      if (res.ok) {
        await loadWorkspaceData(selectedDevice.id);
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateConfig = async (nextConfig: EngineConfig) => {
    setIsBusy(true);
    try {
      const res = await repository.updateEngineConfig(nextConfig, activeActor);
      if (res.ok) {
        setEngineConfig(res.data);
        return { ok: true };
      }
      return { ok: false, message: res.message };
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9f8] text-stone-900">
      {isDemo && <DemoModeBanner onReset={handleResetDemo} isResetting={isBusy} />}

      {/* Top Operations Navigation Header */}
      <header className="no-print sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg tracking-tight text-stone-950 hover:text-teal-900"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-900 text-white">
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>ReuseFlow</span>
              </Link>
              <span className="hidden sm:inline-block h-4 w-px bg-stone-300" />
              <span className="text-xs font-medium text-stone-600">
                {isDemo
                  ? 'Interactive Public Sandbox (/demo)'
                  : 'Authenticated Operations Workspace (/app)'}
              </span>
            </div>

            {!isDemo && (
              <Link
                href="/demo"
                className="lg:hidden text-xs font-semibold text-teal-800 hover:underline"
              >
                Switch to /demo
              </Link>
            )}
          </div>

          {/* Primary Navigation Tabs & Role Switcher */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3">
            <nav aria-label="Workspace Views" className="flex items-center gap-1 rounded-lg bg-stone-100 p-1 border border-stone-200">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  activeTab === 'inventory'
                    ? 'bg-white text-teal-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                )}
              >
                <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                Inventory & Triage ({allDevices.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('intake')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  activeTab === 'intake'
                    ? 'bg-white text-teal-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                )}
              >
                <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                New Device
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scenario')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  activeTab === 'scenario'
                    ? 'bg-white text-teal-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                )}
              >
                <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                Scenario Lab
              </button>
            </nav>

            {/* Sandbox Role Switcher (for testing Manager vs Technician vs Viewer permissions) */}
            {isDemo ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs">
                <UserCheck className="h-3.5 w-3.5 text-teal-800 shrink-0" aria-hidden="true" />
                <label htmlFor="demo-role-select" className="text-stone-600 font-medium">
                  Simulate Role:
                </label>
                <select
                  id="demo-role-select"
                  value={demoRole}
                  onChange={(e) => setDemoRole(e.target.value as UserRole)}
                  className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer"
                >
                  <option value="manager">Manager (Can Approve & Verify)</option>
                  <option value="technician">Technician (Intake & Assess Only)</option>
                  <option value="viewer">Viewer (Read-Only Analyst)</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs">
                <Lock className="h-3.5 w-3.5 text-teal-800" aria-hidden="true" />
                <span className="font-semibold text-stone-800">{activeActor.name}</span>
                <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-900">
                  {activeActor.role}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {toastMessage && (
          <div
            role="status"
            className="no-print flex items-center justify-between gap-3 rounded-lg border border-teal-300 bg-teal-50 px-4 py-3 text-xs sm:text-sm font-medium text-teal-950 shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-800 shrink-0" aria-hidden="true" />
              {toastMessage}
            </span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <ErrorState
            message={error}
            onRetry={() => {
              void loadWorkspaceData();
            }}
          />
        )}

        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <>
            {/* TAB 1: Inventory, Assessment & Approval Workflow */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950">
                      Device Refurbishment Triage & Decision Queue
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Standardized intake, versioned cost/margin evaluation, safety quarantine gates, and human-approved workflow transitions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('intake')}
                      disabled={activeActor.role === 'viewer'}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" aria-hidden="true" />
                      New Device Intake
                    </button>
                  </div>
                </div>

                {/* Dashboard Metrics Overview */}
                <div className="no-print">
                  <OperationsDashboardOverview
                    devices={allDevices}
                    engineConfig={engineConfig}
                  />
                </div>

                {/* Filters & Inventory Table */}
                <div className="no-print space-y-3">
                  <DeviceFiltersBar
                    filters={filters}
                    onChange={setFilters}
                    totalCount={allDevices.length}
                    filteredCount={filteredDevices.length}
                    rightSlot={
                      <CsvExportButton devices={filteredDevices} isDemo={isDemo} />
                    }
                  />

                  <DeviceTable
                    devices={filteredDevices}
                    selectedDeviceId={selectedDevice?.id}
                    onSelectDevice={(dev) => {
                      setSelectedDeviceId(dev.id);
                      detailPanelRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                      });
                    }}
                  />
                </div>

                {/* Active Device Inspection Drawer / Detail View */}
                {selectedDevice && (
                  <div
                    ref={detailPanelRef}
                    className="pt-2 border-t-2 border-stone-300 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-2xs">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded px-2 py-0.5">
                            {selectedDevice.assetTag}
                          </span>
                          <h2 className="text-lg font-bold text-stone-950">
                            {selectedDevice.brand} {selectedDevice.model}
                          </h2>
                          <WorkflowStatusBadge status={selectedDevice.status} />
                        </div>
                        <p className="mt-1 text-xs text-stone-600">
                          Category:{' '}
                          <strong className="capitalize">{selectedDevice.category}</strong> ·
                          RAM:{' '}
                          <strong>
                            {selectedDevice.ramGb !== null
                              ? `${selectedDevice.ramGb} GB`
                              : 'Unrecorded'}
                          </strong>{' '}
                          · Storage:{' '}
                          <strong>
                            {selectedDevice.storagePresent
                              ? `${selectedDevice.storageGb ?? '?'} GB Installed`
                              : 'None'}
                          </strong>{' '}
                          · Condition:{' '}
                          <strong className="capitalize">{selectedDevice.condition}</strong>
                        </p>
                      </div>
                      <span className="text-xs text-stone-500">
                        Record ID: <code className="font-mono">{selectedDevice.id}</code>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      <div className="lg:col-span-7 space-y-5">
                        <AssessmentPanel
                          device={selectedDevice}
                          engineConfig={engineConfig}
                          actorRole={activeActor.role}
                          onRunAssessment={handleRunAssessment}
                          isAssessing={isBusy}
                        />
                      </div>

                      <div className="lg:col-span-5 space-y-5">
                        <WorkflowDecisionControls
                          device={selectedDevice}
                          actorRole={activeActor.role}
                          onTransition={handleTransition}
                          onVerifySanitization={handleVerifySanitization}
                          isBusy={isBusy}
                        />
                        <WorkflowTimeline events={selectedDevice.workflowEvents} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: New Device Intake Form */}
            {activeTab === 'intake' && (
              <div className="max-w-4xl mx-auto space-y-4">
                <DeviceIntakeForm
                  engineConfig={engineConfig}
                  isSubmitting={isBusy}
                  onSubmit={handleCreateDevice}
                  onCancel={() => setActiveTab('inventory')}
                />
              </div>
            )}

            {/* TAB 3: Scenario Lab, Assumptions & Optional Resend Email Summary */}
            {activeTab === 'scenario' && (
              <div className="space-y-6">
                <ScenarioLab
                  engineConfig={engineConfig}
                  actorRole={activeActor.role}
                  onUpdateEngineConfig={handleUpdateConfig}
                />
                <EmailSummaryPanel
                  devices={allDevices}
                  isDemo={isDemo}
                  actorRole={activeActor.role}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer with explicit safety and case-alignment disclosures */}
      <footer className="no-print border-t border-stone-200 bg-white mt-12 py-5 px-4 sm:px-6 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-800 shrink-0" aria-hidden="true" />
            <span>
              <strong>Safety & Data Integrity:</strong> ReuseFlow provides decision support only. It never performs certified data wiping or automated device disposal.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-stone-500">
            <Link href="/" className="hover:text-stone-900 underline">
              Overview
            </Link>
            <Link href="/demo" className="hover:text-stone-900 underline">
              Public Sandbox (/demo)
            </Link>
            <Link href="/app" className="hover:text-stone-900 underline">
              Staff Workspace (/app)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
