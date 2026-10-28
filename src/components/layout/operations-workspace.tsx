'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileSpreadsheet,
  History,
  Layers,
  Lock,
  LogOut,
  Mail,
  Menu,
  PlusCircle,
  Printer,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  UserCog,
  X,
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
  DecisionBadge,
  DemoModeBanner,
  ErrorState,
  LoadingSkeleton,
  SanitizationBadge,
  WorkflowStatusBadge,
} from '@/components/shared/badges-and-banners';
import { ReuseFlowLogo } from '@/components/shared/reuseflow-logo';
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
import { DeviceResearchPanel } from '@/components/research/device-research-panel';
import { cn } from '@/lib/utils';

type WorkspaceTab =
  | 'inventory'
  | 'intake'
  | 'research'
  | 'scenario'
  | 'reports'
  | 'profile'
  | 'admin';

type WorkbenchSubTab =
  | 'all'
  | 'assessment'
  | 'research'
  | 'workflow'
  | 'specs'
  | 'timeline';

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
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (pathname?.endsWith('/devices/new')) return 'intake';
    if (pathname?.endsWith('/settings')) return 'scenario';
    return 'inventory';
  });
  const [workbenchSubTab, setWorkbenchSubTab] = useState<WorkbenchSubTab>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const filteredDevices = useMemo(() => {
    return allDevices.filter((d) => {
      if (filters.category && filters.category !== 'all' && d.category !== filters.category) {
        return false;
      }
      if (filters.status && filters.status !== 'all' && d.status !== filters.status) {
        return false;
      }
      if (
        filters.decision &&
        filters.decision !== 'all' &&
        d.latestAssessment?.decision !== filters.decision
      ) {
        return false;
      }
      if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.trim().toLowerCase();
        const hay = `${d.assetTag} ${d.brand} ${d.model} ${d.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allDevices, filters]);

  const loadWorkspaceData = useCallback(
    async (preferredSelectedId?: string) => {
      try {
        setError(null);
        const [fullList, cfg] = await Promise.all([
          repository.list(),
          repository.getEngineConfig(),
        ]);

        setAllDevices(fullList);
        setEngineConfig(cfg);

        setSelectedDeviceId((prev) => {
          const targetId = preferredSelectedId ?? prev;
          if (targetId && fullList.some((d) => d.id === targetId)) {
            return targetId;
          }
          // Check if URL matches /app/devices/[id]
          const routeMatch = pathname?.match(/\/devices\/([^/]+)$/);
          if (routeMatch && routeMatch[1] && routeMatch[1] !== 'new') {
            const param = decodeURIComponent(routeMatch[1]).toLowerCase();
            const matched = fullList.find(
              (d) =>
                d.id.toLowerCase() === param || d.assetTag.toLowerCase() === param
            );
            if (matched) return matched.id;
          }
          return fullList[0]?.id ?? null;
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load device inventory.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [repository, pathname]
  );

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  const selectedDevice =
    allDevices.find((d) => d.id === selectedDeviceId) ?? filteredDevices[0] ?? null;

  const selectTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleResetDemo = async () => {
    if (!onResetDemo) return;
    setIsBusy(true);
    try {
      const fresh = await onResetDemo();
      setFilters({ search: '', category: 'all', decision: 'all', status: 'all' });
      setAllDevices(fresh);
      setSelectedDeviceId(fresh[0]?.id ?? null);
      setEngineConfig(await repository.getEngineConfig());
      setActiveTab('inventory');
      setWorkbenchSubTab('all');
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
      setWorkbenchSubTab('all');
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

  const handleBatchReassessQueue = async () => {
    if (activeActor.role === 'viewer') return;
    setIsBusy(true);
    setToastMessage(null);
    try {
      const openUnits = allDevices.filter(
        (d) => d.status === 'intake' || d.status === 'assessed'
      );
      for (const unit of openUnits) {
        await repository.assessDevice(unit.id, activeActor, engineConfig);
      }
      await loadWorkspaceData(selectedDevice?.id);
      setToastMessage(
        `Batch re-evaluated ${openUnits.length} open queue ${
          openUnits.length === 1 ? 'device' : 'devices'
        } against Rule v${engineConfig.ruleVersion} ($${(
          engineConfig.hourlyRateCents / 100
        ).toFixed(0)}/hr labor, $${(engineConfig.minMarginCents / 100).toFixed(0)} min margin).`
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleApplyResearchComp = async (
    suggestedCompCents: number,
    suggestedPartsCents?: number
  ): Promise<{ ok: boolean; message?: string }> => {
    if (!selectedDevice) return { ok: false, message: 'No device selected.' };
    return handleUpdateIntakeAndReassess({
      id: selectedDevice.id,
      ramGb: selectedDevice.ramGb,
      storageGb: selectedDevice.storageGb,
      boots: selectedDevice.boots,
      condition: selectedDevice.condition,
      batterySafety: selectedDevice.batterySafety,
      storagePresent: selectedDevice.storagePresent,
      repairable: selectedDevice.repairable,
      chargerIncluded: selectedDevice.chargerIncluded,
      partsCostCents:
        suggestedPartsCents !== undefined ? suggestedPartsCents : selectedDevice.partsCostCents,
      estimatedLaborMinutes: selectedDevice.estimatedLaborMinutes,
      comparableValueCents: suggestedCompCents,
    });
  };

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'inventory',
      label: `Inventory & Triage (${allDevices.length})`,
      badge: 'Workbench',
      icon: ClipboardList,
    },
    {
      id: 'intake',
      label: 'New Device',
      badge: '90s Intake',
      icon: PlusCircle,
    },
    {
      id: 'research',
      label: 'AI & Web Research',
      badge: 'Tavily + Nebius',
      icon: Sparkles,
    },
    {
      id: 'scenario',
      label: 'Scenario Lab',
      badge: 'Economics',
      icon: Calculator,
    },
    {
      id: 'reports',
      label: 'Reports & Email',
      badge: 'Summary',
      icon: Mail,
    },
    {
      id: 'profile',
      label: 'My Profile',
      badge: activeActor.role,
      icon: UserCog,
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      badge: 'Governance',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      {isDemo && <DemoModeBanner onReset={handleResetDemo} isResetting={isBusy} />}

      {/* Two-Tier Professional SaaS Command Header */}
      <header className="no-print sticky top-0 z-30 border-b border-[#E8E8EC] bg-[#FFFFFF]/95 backdrop-blur-md shadow-[0_1px_2px_rgba(10,10,10,0.03)]">
        {/* Tier 1: Brand Identity, Environment Badge, Role Controls & Quick Actions */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <ReuseFlowLogo
                size="sm"
                showVersion
                subtitle={
                  isDemo
                    ? 'Interactive Public Sandbox (/demo)'
                    : 'Authenticated Operations Workspace (/app)'
                }
              />
            </Link>

            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F6] border border-[#E8E8EC] px-2.5 py-1 text-[11px] font-medium text-[#6B6B6B]">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isDemo ? 'bg-[#6366F1]' : 'bg-[#10B981]'
                )}
              />
              {isDemo ? 'Zero-DB Browser Sandbox' : 'Supabase RLS Protected'}
            </span>
          </div>

          {/* Right Controls: Role Switcher / User Profile + Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isDemo ? (
              <div className="flex items-center gap-1.5 rounded-[8px] border border-[#E8E8EC] bg-[#FAFAFA] px-2.5 sm:px-3 py-1.5 min-h-[38px] text-[12px]">
                <UserCheck
                  className="h-3.5 w-3.5 text-[#6366F1] shrink-0 hidden sm:inline"
                  aria-hidden="true"
                />
                <label
                  htmlFor="demo-role-select"
                  className="text-[#6B6B6B] font-medium hidden md:inline"
                >
                  Simulate Role:
                </label>
                <select
                  id="demo-role-select"
                  aria-label="Simulate Role:"
                  value={demoRole}
                  onChange={(e) => setDemoRole(e.target.value as UserRole)}
                  className="bg-transparent font-semibold text-[#0A0A0A] focus:outline-none cursor-pointer max-w-[165px] sm:max-w-none truncate"
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
                  onClick={() => selectTab('profile')}
                  className="flex items-center gap-2 rounded-[8px] border border-[#E8E8EC] bg-[#FAFAFA] hover:bg-[#F4F4F6] px-2.5 sm:px-3 py-1.5 min-h-[38px] text-[12px] transition-colors cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                  <span className="font-medium text-[#0A0A0A] truncate max-w-[120px] sm:max-w-[160px]">
                    {activeActor.name}
                  </span>
                  <span className="rounded-full bg-[#6366F1]/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#4F46E5]">
                    {activeActor.role}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  aria-label="Sign out of workspace"
                  className="genesis-btn-secondary inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[38px] text-[12px] cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-[#6B6B6B]" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}

            {isDemo && (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-1.5 rounded-[8px] border border-[#E8E8EC] bg-[#FFFFFF] hover:bg-[#FAFAFA] px-3 py-1.5 min-h-[38px] text-[12px] font-medium text-[#0A0A0A] transition-colors"
              >
                <Lock className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                Staff Login (/app)
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle workspace navigation menu"
              className="lg:hidden inline-flex items-center justify-center rounded-[8px] border border-[#E8E8EC] bg-[#FAFAFA] p-2 text-[#0A0A0A] hover:bg-[#F4F4F6] cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Tier 2: Desktop Primary Feature Menu Tabs */}
        <div className="border-t border-[#F1F1F4] bg-[#FAFAFA]/70">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto">
            <nav
              aria-label="Workspace Views"
              className="flex items-center gap-1 py-1.5"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={cn(
                      'group relative inline-flex items-center gap-2 rounded-[8px] px-3.5 py-2 min-h-[38px] text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer',
                      isActive
                        ? 'bg-[#0A0A0A] text-[#FFFFFF] shadow-xs'
                        : 'text-[#6B6B6B] hover:bg-[#ECECEF]/80 hover:text-[#0A0A0A]'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-colors',
                        isActive
                          ? 'text-[#818CF8]'
                          : 'text-[#6B6B6B] group-hover:text-[#0A0A0A]'
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'hidden xl:inline-block rounded-[4px] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-tight',
                          isActive
                            ? 'bg-[#FFFFFF]/15 text-[#E0E7FF]'
                            : 'bg-[#FFFFFF] border border-[#E8E8EC] text-[#6B6B6B]'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-2 shrink-0 py-1">
              <span className="text-[11px] font-mono text-[#6B6B6B]">
                Engine: <strong className="text-[#0A0A0A]">v{engineConfig.ruleVersion}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E8E8EC] bg-[#FFFFFF] px-4 py-3 space-y-2 shadow-lg">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9C9C] px-2">
              Workspace Modules
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={`mobile-${item.id}`}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={cn(
                      'flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[13px] font-medium text-left cursor-pointer',
                      isActive
                        ? 'bg-[#6366F1] text-[#FFFFFF]'
                        : 'bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#F4F4F6]'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-mono uppercase',
                          isActive
                            ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                            : 'bg-[#FFFFFF] border border-[#E8E8EC] text-[#6B6B6B]'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-[#E8E8EC] flex items-center justify-between text-[12px]">
              <Link
                href="/"
                className="text-[#6B6B6B] hover:text-[#0A0A0A] font-medium"
              >
                ← Back to Overview
              </Link>
              {isDemo ? (
                <Link
                  href="/login"
                  className="text-[#6366F1] font-semibold hover:underline"
                >
                  Open Staff Login (/app) →
                </Link>
              ) : (
                <Link
                  href="/demo"
                  className="text-[#6366F1] font-semibold hover:underline"
                >
                  Open Public Sandbox (/demo) →
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area (1280px max width) */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
            {/* TAB 1: Inventory, Assessment & Approval Workbench */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#6366F1] mb-1">
                      <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                      Refurbishment Operations Command Center
                    </div>
                    <h1 className="font-display text-[24px] sm:text-[30px] font-bold tracking-[-0.03em] text-[#0A0A0A]">
                      Device Refurbishment Triage & Decision Queue
                    </h1>
                    <p className="text-[14px] text-[#6B6B6B]">
                      Standardized intake, versioned cost/margin evaluation, safety quarantine gates, and human-approved workflow transitions.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleBatchReassessQueue()}
                      disabled={isBusy || activeActor.role === 'viewer'}
                      className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] disabled:opacity-50 cursor-pointer"
                      title="Re-evaluate all intake and assessed queue devices against current v1.0.0 engine parameters"
                    >
                      <RefreshCw
                        className={cn(
                          'h-4 w-4 text-[#6366F1]',
                          isBusy && 'animate-spin'
                        )}
                        aria-hidden="true"
                      />
                      Batch Re-Score Queue
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTab('scenario')}
                      className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] cursor-pointer"
                    >
                      <Calculator className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
                      Open ROI Calculator
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTab('intake')}
                      disabled={activeActor.role === 'viewer'}
                      className="genesis-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-[13px] disabled:opacity-50 cursor-pointer"
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

                {/* Active Device Inspection Workbench */}
                {selectedDevice && (
                  <div
                    ref={detailPanelRef}
                    className="pt-6 border-t-2 border-[#E8E8EC] space-y-4"
                  >
                    {/* Quick-Switch Device Pill Bar */}
                    <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#E8E8EC] bg-[#FFFFFF] px-4 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                        Quick-Switch Bench Unit:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {filteredDevices.map((dev) => {
                          const isCurrent = dev.id === selectedDevice.id;
                          const isQuarantine =
                            dev.status === 'quarantined' ||
                            dev.latestAssessment?.decision === 'QUARANTINE';
                          const isMissing =
                            dev.latestAssessment?.decision === 'INSUFFICIENT_DATA';
                          return (
                            <button
                              key={`pill-${dev.id}`}
                              type="button"
                              onClick={() => setSelectedDeviceId(dev.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono font-medium transition-colors cursor-pointer',
                                isCurrent
                                  ? 'bg-[#6366F1] text-[#FFFFFF]'
                                  : 'bg-[#F4F4F6] text-[#0A0A0A] hover:bg-[#E8E8EC]'
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  isCurrent
                                    ? 'bg-[#FFFFFF]'
                                    : isQuarantine
                                      ? 'bg-[#F59E0B]'
                                      : isMissing
                                        ? 'bg-[#6366F1]'
                                        : 'bg-[#10B981]'
                                )}
                              />
                              {dev.assetTag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Device Summary Header + Workbench Sub-Navigation */}
                    <div className="genesis-card overflow-hidden">
                      <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#FFFFFF]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-[12px] font-semibold text-[#4F46E5] bg-[#EEF2FF] border border-[#C7D2FE] rounded-[5px] px-2.5 py-0.5">
                              {selectedDevice.assetTag}
                            </span>
                            <h2 className="font-display text-[20px] font-bold text-[#0A0A0A]">
                              {selectedDevice.brand} {selectedDevice.model}
                            </h2>
                            <WorkflowStatusBadge status={selectedDevice.status} />
                            <DecisionBadge
                              decision={selectedDevice.latestAssessment?.decision}
                            />
                          </div>
                          <p className="mt-1.5 text-[13px] text-[#6B6B6B]">
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

                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#9C9C9C]">
                          <SanitizationBadge
                            storagePresent={selectedDevice.storagePresent}
                            status={selectedDevice.sanitizationStatus}
                            compact
                          />
                          <span className="hidden sm:inline">·</span>
                          <span>
                            ID: <code className="font-mono">{selectedDevice.id}</code>
                          </span>
                        </div>
                      </div>

                      {/* Workbench Sub-Tabs Bar */}
                      <div className="no-print border-t border-[#E8E8EC] bg-[#FAFAFA] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
                        <div
                          role="tablist"
                          aria-label="Active Device Workbench Views"
                          className="flex flex-wrap items-center gap-1"
                        >
                          {(
                            [
                              {
                                id: 'all',
                                label: 'All Workbench Panels (Split View)',
                                icon: Layers,
                              },
                              {
                                id: 'assessment',
                                label: 'Explainable Assessment & Cost Math',
                                icon: Calculator,
                              },
                              {
                                id: 'research',
                                label: 'AI & Web Research (Tavily + Nebius)',
                                icon: Sparkles,
                              },
                              {
                                id: 'workflow',
                                label: 'Approval & Sanitization Gate',
                                icon: ShieldCheck,
                              },
                              {
                                id: 'specs',
                                label: 'Edit Bench Specs',
                                icon: Edit3,
                              },
                              {
                                id: 'timeline',
                                label: `Audit Timeline (${selectedDevice.workflowEvents.length})`,
                                icon: History,
                              },
                            ] as const
                          ).map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = workbenchSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                role="tab"
                                aria-selected={isSubActive}
                                onClick={() => setWorkbenchSubTab(sub.id)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer',
                                  isSubActive
                                    ? 'bg-[#6366F1] text-[#FFFFFF]'
                                    : 'text-[#6B6B6B] hover:bg-[#E8E8EC]/70 hover:text-[#0A0A0A]'
                                )}
                              >
                                <SubIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Quick Edit Intake Specs Banner / Form */}
                    {(workbenchSubTab === 'all' || workbenchSubTab === 'specs') && (
                      <DeviceIntakeQuickEdit
                        key={`quick-edit-${selectedDevice.id}-${workbenchSubTab}`}
                        device={selectedDevice}
                        actorRole={activeActor.role}
                        isBusy={isBusy}
                        defaultOpen={workbenchSubTab === 'specs'}
                        onSaveAndReassess={handleUpdateIntakeAndReassess}
                      />
                    )}

                    {/* Main Workbench Panels */}
                    {workbenchSubTab === 'all' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          <div className="lg:col-span-7 space-y-6">
                            <AssessmentPanel
                              key={`assessment-panel-${selectedDevice.id}`}
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

                        <DeviceResearchPanel
                          key={`workbench-research-${selectedDevice.id}`}
                          device={selectedDevice}
                          allDevices={allDevices}
                          actorRole={activeActor.role}
                          onSelectDevice={(id) => setSelectedDeviceId(id)}
                          onApplySuggestedComp={handleApplyResearchComp}
                          compact
                        />
                      </div>
                    )}

                    {workbenchSubTab === 'assessment' && (
                      <AssessmentPanel
                        key={`assessment-only-${selectedDevice.id}`}
                        device={selectedDevice}
                        engineConfig={engineConfig}
                        actorRole={activeActor.role}
                        onRunAssessment={handleRunAssessment}
                        isAssessing={isBusy}
                      />
                    )}

                    {workbenchSubTab === 'research' && (
                      <DeviceResearchPanel
                        key={`subtab-research-${selectedDevice.id}`}
                        device={selectedDevice}
                        allDevices={allDevices}
                        actorRole={activeActor.role}
                        onSelectDevice={(id) => setSelectedDeviceId(id)}
                        onApplySuggestedComp={handleApplyResearchComp}
                      />
                    )}

                    {workbenchSubTab === 'workflow' && (
                      <div className="max-w-3xl">
                        <WorkflowDecisionControls
                          device={selectedDevice}
                          actorRole={activeActor.role}
                          onTransition={handleTransition}
                          onVerifySanitization={handleVerifySanitization}
                          isBusy={isBusy}
                        />
                      </div>
                    )}

                    {workbenchSubTab === 'timeline' && (
                      <div className="max-w-3xl">
                        <WorkflowTimeline events={selectedDevice.workflowEvents} />
                      </div>
                    )}
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
                  onCancel={() => selectTab('inventory')}
                />
              </div>
            )}

            {/* TAB 2.5: AI & Live Web Bench Research Copilot (Tavily + Nebius TokenFactory) */}
            {activeTab === 'research' && (
              <div className="space-y-6">
                <DeviceResearchPanel
                  key={`top-research-${selectedDevice?.id ?? 'none'}`}
                  device={selectedDevice}
                  allDevices={allDevices}
                  actorRole={activeActor.role}
                  onSelectDevice={(id) => setSelectedDeviceId(id)}
                  onApplySuggestedComp={handleApplyResearchComp}
                />
              </div>
            )}

            {/* TAB 3: Scenario Lab, Strategic Matrix & Economic Assumptions */}
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

            {/* TAB 4: Operational Reports, Email Digest & CSV Export */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="genesis-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#6366F1] mb-1">
                      <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                      Executive Reporting & Export Center
                    </div>
                    <h2 className="font-display text-[22px] font-bold text-[#0A0A0A]">
                      Operational Summary, Non-PII CSV Export & Email Digest
                    </h2>
                    <p className="text-[13px] text-[#6B6B6B] mt-1">
                      Export aggregate queue metrics, trigger allowlisted manager email summaries via Resend, or print a non-PII batch report.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <CsvExportButton devices={allDevices} isDemo={isDemo} />
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-[#6B6B6B]" aria-hidden="true" />
                      Print Queue Report
                    </button>
                  </div>
                </div>

                <OperationsDashboardOverview
                  devices={allDevices}
                  engineConfig={engineConfig}
                />

                <EmailSummaryPanel
                  devices={allDevices}
                  isDemo={isDemo}
                  actorRole={activeActor.role}
                />
              </div>
            )}

            {/* TAB 5: Staff Profile & RBAC Permissions */}
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

            {/* TAB 6: Admin Panel & System Governance */}
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

      {/* Footer with Brand Logo, Quick Navigation & Safety Disclosures */}
      <footer className="no-print border-t border-[#E8E8EC] bg-[#FFFFFF] mt-16 py-8 px-4 sm:px-6 text-[12px] text-[#6B6B6B]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <ReuseFlowLogo
              size="sm"
              subtitle="Smart Refurbishment Decision Engine · GPL-3.0 Open Source"
            />
            <p className="flex items-center gap-2 text-[#6B6B6B] pt-1">
              <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-[#0A0A0A]">Safety & Data Integrity:</strong> ReuseFlow provides decision support only. It never performs certified data wiping or automated device disposal.
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[#6B6B6B] font-medium">
            <Link href="/" className="hover:text-[#6366F1] transition-colors">
              Overview
            </Link>
            <Link href="/demo" className="hover:text-[#6366F1] transition-colors">
              Public Sandbox (/demo)
            </Link>
            <Link href="/app" className="hover:text-[#6366F1] transition-colors">
              Staff Workspace (/app)
            </Link>
            <Link href="/login" className="hover:text-[#6366F1] transition-colors">
              One-Click Login (/login)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
