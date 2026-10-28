'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Lock,
  LogOut,
  PlusCircle,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserCog,
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
import {
  DeviceCreateInput,
  DeviceUpdateIntakeInput,
} from '@/lib/validation/schemas';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
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
import { DeviceIntakeQuickEdit } from '@/components/devices/device-intake-quick-edit';
import { AssessmentPanel } from '@/components/assessments/assessment-panel';
import {
  WorkflowDecisionControls,
  WorkflowTimeline,
} from '@/components/devices/workflow-timeline-and-dialogs';
import {
  AdminGovernancePanel,
  UserProfilePanel,
} from '@/components/profile/profile-and-admin-panel';
import { cn } from '@/lib/utils';

type WorkspaceTab = 'inventory' | 'intake' | 'scenario' | 'profile' | 'admin';

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('inventory');
  const [demoRole, setDemoRole] = useState<UserRole>('manager');
  const [customActorName, setCustomActorName] = useState<string | null>(null);
  const baseActor: ActorContext = fixedActor ?? DEMO_ACTORS[demoRole];
  const activeActor: ActorContext = customActorName
    ? { ...baseActor, name: customActorName }
    : baseActor;

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
    router.refresh();
  };

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

  const handleUpdateIntakeAndReassess = async (
    updates: DeviceUpdateIntakeInput
  ): Promise<{ ok: boolean; message?: string }> => {
    if (!selectedDevice) return { ok: false, message: 'No device selected.' };
    setIsBusy(true);
    setToastMessage(null);
    try {
      const updateRes = await repository.updateIntake(
        selectedDevice.id,
        updates,
        activeActor
      );
      if (!updateRes.ok) {
        return { ok: false, message: updateRes.message };
      }

      const assessRes = await repository.assessDevice(
        selectedDevice.id,
        activeActor,
        engineConfig
      );
      await loadWorkspaceData(selectedDevice.id);
      if (assessRes.ok) {
        setToastMessage(
          `Updated intake specs for ${selectedDevice.assetTag} and re-evaluated v1.0.0: ${assessRes.data.assessment.decision}.`
        );
      } else {
        setToastMessage(`Updated intake specs for ${selectedDevice.assetTag}.`);
      }
      return { ok: true };
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
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      {isDemo && <DemoModeBanner onReset={handleResetDemo} isResetting={isBusy} />}

      {/* Genesis Sticky Top Navigation (56px height, backdrop-blur, 1px border #E8E8EC) */}
      <header className="no-print sticky top-0 z-20 border-b border-[#E8E8EC] bg-[#FFFFFF]/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-6 min-h-[56px] py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-display font-bold text-[18px] tracking-[-0.03em] text-[#0A0A0A] hover:text-[#6366F1] transition-colors"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#0A0A0A] text-[#FAFAFA]">
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>ReuseFlow</span>
              </Link>
              <span className="hidden sm:inline-block h-4 w-px bg-[#E8E8EC]" />
              <span className="text-[13px] font-medium text-[#6B6B6B]">
                {isDemo
                  ? 'Interactive Public Sandbox (/demo)'
                  : 'Authenticated Operations Workspace (/app)'}
              </span>
            </div>

            {!isDemo && (
              <Link
                href="/demo"
                className="lg:hidden text-[12px] font-medium text-[#6366F1] hover:underline"
              >
                Switch to /demo
              </Link>
            )}
          </div>

          {/* Primary Navigation Chips & Role Switcher */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3">
            <nav
              aria-label="Workspace Views"
              className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0"
            >
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-[38px] text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer',
                  activeTab === 'inventory'
                    ? 'bg-[#6366F1] text-[#FAFAFA]'
                    : 'bg-[#F4F4F6] text-[#6B6B6B] hover:text-[#0A0A0A]'
                )}
              >
                <ClipboardList className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Inventory & Triage ({allDevices.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('intake')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-[38px] text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer',
                  activeTab === 'intake'
                    ? 'bg-[#6366F1] text-[#FAFAFA]'
                    : 'bg-[#F4F4F6] text-[#6B6B6B] hover:text-[#0A0A0A]'
                )}
              >
                <PlusCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                New Device
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('scenario')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-[38px] text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer',
                  activeTab === 'scenario'
                    ? 'bg-[#6366F1] text-[#FAFAFA]'
                    : 'bg-[#F4F4F6] text-[#6B6B6B] hover:text-[#0A0A0A]'
                )}
              >
                <Calculator className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Scenario Lab
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-[38px] text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer',
                  activeTab === 'profile'
                    ? 'bg-[#6366F1] text-[#FAFAFA]'
                    : 'bg-[#F4F4F6] text-[#6B6B6B] hover:text-[#0A0A0A]'
                )}
              >
                <UserCog className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                My Profile
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 min-h-[38px] text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer',
                  activeTab === 'admin'
                    ? 'bg-[#6366F1] text-[#FAFAFA]'
                    : 'bg-[#F4F4F6] text-[#6B6B6B] hover:text-[#0A0A0A]'
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Admin Panel
              </button>
            </nav>

            {isDemo ? (
              <div className="flex items-center gap-1.5 rounded-[6px] border border-[#E8E8EC] bg-[#FAFAFA] px-3 py-1.5 min-h-[38px] text-[12px]">
                <UserCheck className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" aria-hidden="true" />
                <label htmlFor="demo-role-select" className="text-[#6B6B6B] font-medium">
                  Simulate Role:
                </label>
                <select
                  id="demo-role-select"
                  value={demoRole}
                  onChange={(e) => setDemoRole(e.target.value as UserRole)}
                  className="bg-transparent font-medium text-[#0A0A0A] focus:outline-none cursor-pointer"
                >
                  <option value="manager">Manager (Can Approve & Verify)</option>
                  <option value="technician">Technician (Intake & Assess Only)</option>
                  <option value="viewer">Viewer (Read-Only Analyst)</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 rounded-[6px] border border-[#E8E8EC] bg-[#FAFAFA] hover:bg-[#F4F4F6] px-3 py-1.5 min-h-[38px] text-[12px] transition-colors cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                  <span className="font-medium text-[#0A0A0A] truncate max-w-[160px]">
                    {activeActor.name}
                  </span>
                  <span className="rounded-full bg-[#6366F1]/15 px-2 py-0.5 text-[11px] font-medium uppercase text-[#4F46E5]">
                    {activeActor.role}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  aria-label="Sign out of workspace"
                  className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-[12px] cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-[#6B6B6B]" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area (1280px max width, 24px horizontal padding) */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-8 space-y-6">
        {toastMessage && (
          <div
            role="status"
            className="no-print flex items-center justify-between gap-3 rounded-[8px] border border-[#10B981]/40 bg-[#10B981]/10 px-4 py-3 text-[13px] font-medium text-[#065F46]"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
              {toastMessage}
            </span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-[12px] font-medium text-[#065F46] hover:underline cursor-pointer"
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
                    <h1 className="font-display text-[24px] sm:text-[32px] font-bold tracking-[-0.03em] text-[#0A0A0A]">
                      Device Refurbishment Triage & Decision Queue
                    </h1>
                    <p className="text-[14px] text-[#6B6B6B]">
                      Standardized intake, versioned cost/margin evaluation, safety quarantine gates, and human-approved workflow transitions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('intake')}
                      disabled={activeActor.role === 'viewer'}
                      className="genesis-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-[14px] disabled:opacity-50 cursor-pointer"
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
                <div className="no-print space-y-4">
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
                    className="pt-4 border-t border-[#E8E8EC] space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 genesis-card px-6 py-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-[12px] font-medium text-[#0A0A0A] bg-[#FAFAFA] border border-[#E8E8EC] rounded-[4px] px-2.5 py-0.5">
                            {selectedDevice.assetTag}
                          </span>
                          <h2 className="font-display text-[20px] font-bold text-[#0A0A0A]">
                            {selectedDevice.brand} {selectedDevice.model}
                          </h2>
                          <WorkflowStatusBadge status={selectedDevice.status} />
                        </div>
                        <p className="mt-1 text-[13px] text-[#6B6B6B]">
                          Category:{' '}
                          <span className="font-medium text-[#0A0A0A] capitalize">
                            {selectedDevice.category}
                          </span>{' '}
                          · RAM:{' '}
                          <span className="font-mono text-[#0A0A0A]">
                            {selectedDevice.ramGb !== null
                              ? `${selectedDevice.ramGb} GB`
                              : 'Unrecorded'}
                          </span>{' '}
                          · Storage:{' '}
                          <span className="font-mono text-[#0A0A0A]">
                            {selectedDevice.storagePresent
                              ? `${selectedDevice.storageGb ?? '?'} GB Installed`
                              : 'None'}
                          </span>{' '}
                          · Condition:{' '}
                          <span className="font-medium text-[#0A0A0A] capitalize">
                            {selectedDevice.condition}
                          </span>
                        </p>
                      </div>
                      <span className="text-[12px] text-[#9C9C9C]">
                        Record ID: <code className="font-mono">{selectedDevice.id}</code>
                      </span>
                    </div>

                    <DeviceIntakeQuickEdit
                      device={selectedDevice}
                      actorRole={activeActor.role}
                      isBusy={isBusy}
                      onSaveAndReassess={handleUpdateIntakeAndReassess}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-7 space-y-6">
                        <AssessmentPanel
                          device={selectedDevice}
                          engineConfig={engineConfig}
                          actorRole={activeActor.role}
                          onRunAssessment={handleRunAssessment}
                          isAssessing={isBusy}
                        />
                      </div>

                      <div className="lg:col-span-5 space-y-6">
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

            {/* TAB 4: Staff Profile & RBAC Permissions */}
            {activeTab === 'profile' && (
              <UserProfilePanel
                actor={activeActor}
                isDemo={isDemo}
                onActorNameUpdated={(newName) => {
                  setCustomActorName(newName);
                  setToastMessage(`Updated display name to '${newName}'.`);
                }}
              />
            )}

            {/* TAB 5: Admin Panel & System Governance */}
            {activeTab === 'admin' && (
              <AdminGovernancePanel
                actor={activeActor}
                isDemo={isDemo}
                devices={allDevices}
              />
            )}
          </>
        )}
      </main>

      {/* Footer with explicit safety and case-alignment disclosures */}
      <footer className="no-print border-t border-[#E8E8EC] bg-[#FFFFFF] mt-16 py-6 px-6 text-[12px] text-[#6B6B6B]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-[#0A0A0A]">Safety & Data Integrity:</strong> ReuseFlow provides decision support only. It never performs certified data wiping or automated device disposal.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[#6B6B6B]">
            <Link href="/" className="hover:text-[#6366F1] underline">
              Overview
            </Link>
            <Link href="/demo" className="hover:text-[#6366F1] underline">
              Public Sandbox (/demo)
            </Link>
            <Link href="/app" className="hover:text-[#6366F1] underline">
              Staff Workspace (/app)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
