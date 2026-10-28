'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Database,
  KeyRound,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';
import {
  AdminSystemOverview,
  Device,
  UserProfile,
  UserRole,
} from '@/types/domain';
import { ActorContext } from '@/lib/repositories/types';
import {
  adminUpdateUserProfileServerAction,
  getAdminSystemOverviewServerAction,
  getMyProfileServerAction,
  updateMyProfileServerAction,
} from '@/lib/actions/profile-admin-actions';
import { EmailSummaryPanel } from '@/components/analytics/email-summary-card';

const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'demo-mgr-1',
    email: 'admin@reuseflow.org',
    displayName: 'Morgan Chen (Operations Manager & Admin)',
    department: 'Refurbishment Governance & Admin',
    jobTitle: 'Refurbishment Operations Manager',
    role: 'manager',
    createdAt: '2026-10-28T08:00:00.000Z',
    updatedAt: '2026-10-28T09:30:00.000Z',
  },
  {
    id: 'demo-tech-1',
    email: 'tech@reuseflow.org',
    displayName: 'Alex Rivera (Senior Bench Technician)',
    department: 'Diagnostics & Triage Bench',
    jobTitle: 'Senior Refurbishment Technician',
    role: 'technician',
    createdAt: '2026-10-28T08:15:00.000Z',
    updatedAt: '2026-10-28T10:15:00.000Z',
  },
  {
    id: 'demo-view-1',
    email: 'viewer@reuseflow.org',
    displayName: 'Jordan Lee (Impact & Audit Analyst)',
    department: 'Sustainability & Audit',
    jobTitle: 'Circular Impact Analyst',
    role: 'viewer',
    createdAt: '2026-10-28T08:30:00.000Z',
    updatedAt: '2026-10-28T11:00:00.000Z',
  },
];

function RolePill({ role }: { role: UserRole }) {
  if (role === 'manager') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1]/15 px-3 py-1 text-[12px] font-medium text-[#4F46E5]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
        Manager / Admin
      </span>
    );
  }
  if (role === 'technician') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/15 px-3 py-1 text-[12px] font-medium text-[#065F46]">
        <UserCheck className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
        Technician / Staff
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F6] px-3 py-1 text-[12px] font-medium text-[#6B6B6B]">
      <Shield className="h-3.5 w-3.5 text-[#9C9C9C]" aria-hidden="true" />
      Viewer / Auditor
    </span>
  );
}

export function UserProfilePanel({
  actor,
  isDemo,
  onActorNameUpdated,
}: {
  actor: ActorContext;
  isDemo: boolean;
  onActorNameUpdated?: (newName: string) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState(actor.name);
  const [department, setDepartment] = useState('Refurbishment Operations');
  const [jobTitle, setJobTitle] = useState('Refurbishment Specialist');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      if (isDemo) {
        const match =
          DEMO_PROFILES.find((p) => p.role === actor.role) ?? DEMO_PROFILES[0]!;
        setProfile(match);
        setDisplayName(match.displayName);
        setDepartment(match.department);
        setJobTitle(match.jobTitle);
        return;
      }

      const res = await getMyProfileServerAction();
      if (res.ok) {
        setProfile(res.data);
        setDisplayName(res.data.displayName);
        setDepartment(res.data.department);
        setJobTitle(res.data.jobTitle);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setIsLoading(false);
    }
  }, [actor.role, isDemo]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      if (isDemo) {
        const updated: UserProfile = {
          ...(profile ?? DEMO_PROFILES[0]!),
          displayName: displayName.trim(),
          department: department.trim(),
          jobTitle: jobTitle.trim(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(updated);
        onActorNameUpdated?.(updated.displayName);
        setFeedback({
          type: 'success',
          text: 'Profile updated in sandbox session.',
        });
        return;
      }

      const res = await updateMyProfileServerAction({
        displayName,
        department,
        jobTitle,
      });

      if (res.ok) {
        setProfile(res.data);
        onActorNameUpdated?.(res.data.displayName);
        setFeedback({
          type: 'success',
          text: 'Your staff profile has been saved to Supabase public.profiles.',
        });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] sm:text-[32px] font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Staff Profile & RBAC Permissions
          </h1>
          <p className="text-[14px] text-[#6B6B6B]">
            Manage your operational display identity, department, and inspect your active Row-Level Security (RLS) permissions.
          </p>
        </div>
        {profile && <RolePill role={profile.role} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Profile Editor Form */}
        <section
          aria-label="Edit Staff Profile"
          className="lg:col-span-7 genesis-card overflow-hidden"
        >
          <div className="border-b border-[#E8E8EC] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              <h2 className="font-display text-[16px] font-bold text-[#0A0A0A]">
                Personal & Operational Identity
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[#6B6B6B]">
              {isDemo ? 'Sandbox Profile' : 'Supabase public.profiles'}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            {feedback && (
              <div
                role="status"
                className={`rounded-[6px] border p-3 text-[13px] font-medium flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#065F46]'
                    : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#991B1B]'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{feedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
                >
                  Authenticated Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={profile?.email ?? 'staff@reuseflow.org'}
                  className="genesis-input w-full min-h-[44px] bg-[#FAFAFA] text-[#6B6B6B] cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-role"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
                >
                  Assigned Security Role (RLS Enforced)
                </label>
                <input
                  id="profile-role"
                  type="text"
                  disabled
                  value={(profile?.role ?? actor.role).toUpperCase()}
                  className="genesis-input w-full min-h-[44px] font-mono bg-[#FAFAFA] text-[#6B6B6B] cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-display-name"
                className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
              >
                Full Display Name (Shown on Assessments & Audit Trail)
              </label>
              <input
                id="profile-display-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="genesis-input w-full min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-department"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
                >
                  Department / Bench Unit
                </label>
                <input
                  id="profile-department"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-job-title"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
                >
                  Operational Title
                </label>
                <input
                  id="profile-job-title"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E8EC]">
              <span className="text-[12px] text-[#6B6B6B]">
                Account ID:{' '}
                <code className="font-mono text-[#0A0A0A]">
                  {profile?.id ?? actor.id}
                </code>
              </span>
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="genesis-btn-primary min-h-[44px] px-5 py-2.5 text-[14px] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* Right: RBAC & RLS Security Matrix */}
        <section
          aria-label="Role Permissions Matrix"
          className="lg:col-span-5 genesis-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
            <h2 className="font-display text-[16px] font-bold text-[#0A0A0A]">
              Postgres RLS & Role Capabilities
            </h2>
          </div>
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
            ReuseFlow prevents self-role escalation via the{' '}
            <code className="font-mono text-[#0A0A0A]">
              trg_prevent_role_self_promotion
            </code>{' '}
            database trigger. Role updates can only be executed by a verified{' '}
            <strong className="text-[#0A0A0A]">Manager / Admin</strong> in the Admin Panel.
          </p>

          <div className="space-y-3 text-[13px]">
            <div className="genesis-panel bg-[#FAFAFA] p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[#0A0A0A]">
                  Manager / Admin
                </span>
                <span className="font-mono text-[11px] text-[#6366F1]">Full Access</span>
              </div>
              <p className="text-[12px] text-[#6B6B6B]">
                Can approve refurbishments, release safety quarantine, close dispositions, update economic assumptions, trigger Resend emails, and manage staff roles in the Admin Panel.
              </p>
            </div>

            <div className="genesis-panel bg-[#FAFAFA] p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[#0A0A0A]">
                  Technician / Staff
                </span>
                <span className="font-mono text-[11px] text-[#10B981]">
                  Bench Operations
                </span>
              </div>
              <p className="text-[12px] text-[#6B6B6B]">
                Can log new device intake, edit intake specs, run v1.0.0 assessments, start bench repairs, and record external NIST 800-88 sanitization verification.
              </p>
            </div>

            <div className="genesis-panel bg-[#FAFAFA] p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[#0A0A0A]">
                  Viewer / Auditor
                </span>
                <span className="font-mono text-[11px] text-[#6B6B6B]">Read-Only</span>
              </div>
              <p className="text-[12px] text-[#6B6B6B]">
                Read-only access to inventory, cost waterfall ledgers, workflow audit logs, CSV exports, and Scenario Lab simulations.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function AdminGovernancePanel({
  actor,
  isDemo,
  devices,
}: {
  actor: ActorContext;
  isDemo: boolean;
  devices: Device[];
}) {
  const [overview, setOverview] = useState<AdminSystemOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadAdminOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isDemo) {
        const demoOverview: AdminSystemOverview = {
          profiles: DEMO_PROFILES,
          emailEvents: [
            {
              id: 'demo-email-1',
              type: 'operational_summary',
              recipient: 'info@ensure.in',
              providerId: 're_demo_preview_01',
              idempotencyKey: 'summary-2026-10-28-6',
              status: 'sent',
              sentBy: 'demo-mgr-1',
              createdAt: '2026-10-28T14:00:00.000Z',
            },
          ],
          counts: {
            users: DEMO_PROFILES.length,
            devices: devices.length,
            assessments: devices.reduce((acc, d) => acc + d.assessments.length, 0),
            workflowEvents: devices.reduce(
              (acc, d) => acc + d.workflowEvents.length,
              0
            ),
            emailEvents: 1,
          },
        };
        setOverview(demoOverview);
        const roleMap: Record<string, UserRole> = {};
        for (const p of demoOverview.profiles) {
          roleMap[p.id] = p.role;
        }
        setPendingRoles(roleMap);
        return;
      }

      const res = await getAdminSystemOverviewServerAction();
      if (res.ok) {
        setOverview(res.data);
        const roleMap: Record<string, UserRole> = {};
        for (const p of res.data.profiles) {
          roleMap[p.id] = p.role;
        }
        setPendingRoles(roleMap);
      } else {
        setBanner({ type: 'error', text: res.message });
      }
    } finally {
      setIsLoading(false);
    }
  }, [devices, isDemo]);

  useEffect(() => {
    void loadAdminOverview();
  }, [loadAdminOverview]);

  const handleUpdateUserRole = async (targetProfile: UserProfile) => {
    const nextRole = pendingRoles[targetProfile.id] ?? targetProfile.role;
    if (actor.role !== 'manager') {
      setBanner({
        type: 'error',
        text: 'Only an Admin / Refurbishment Manager can modify user roles.',
      });
      return;
    }

    setSavingUserId(targetProfile.id);
    setBanner(null);
    try {
      if (isDemo) {
        setOverview((prev) =>
          prev
            ? {
                ...prev,
                profiles: prev.profiles.map((p) =>
                  p.id === targetProfile.id ? { ...p, role: nextRole } : p
                ),
              }
            : prev
        );
        setBanner({
          type: 'success',
          text: `Updated ${targetProfile.displayName} role to '${nextRole}' in sandbox.`,
        });
        return;
      }

      const res = await adminUpdateUserProfileServerAction({
        targetUserId: targetProfile.id,
        newRole: nextRole,
      });

      if (res.ok) {
        await loadAdminOverview();
        setBanner({
          type: 'success',
          text: `Updated ${res.data.displayName} (${res.data.email}) role to '${res.data.role}' in Supabase.`,
        });
      } else {
        setBanner({ type: 'error', text: res.message });
      }
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredProfiles = (overview?.profiles ?? []).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] sm:text-[32px] font-bold tracking-[-0.03em] text-[#0A0A0A]">
            Admin Panel & System Governance
          </h1>
          <p className="text-[14px] text-[#6B6B6B]">
            Manage registered staff profiles, RBAC role assignments, Supabase database telemetry, and Resend operational email audit logs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAdminOverview()}
          disabled={isLoading}
          className="genesis-btn-secondary min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-[13px] cursor-pointer"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh Telemetry
        </button>
      </div>

      {actor.role !== 'manager' && (
        <div
          role="status"
          className="rounded-[8px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4 text-[13px] text-[#92400E] flex items-center gap-2.5"
        >
          <ShieldAlert className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
          <span>
            You are currently signed in as <strong className="uppercase">{actor.role}</strong>. You can inspect staff directory and database telemetry, but role changes and outbound Resend email triggers require <strong className="underline">MANAGER / ADMIN</strong> privileges.
          </span>
        </div>
      )}

      {banner && (
        <div
          role="status"
          className={`rounded-[8px] border p-4 text-[13px] font-medium flex items-center justify-between gap-3 ${
            banner.type === 'success'
              ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#065F46]'
              : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#991B1B]'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {banner.text}
          </span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-[12px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* System Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="genesis-card p-5 space-y-1">
          <div className="flex items-center justify-between text-[12px] text-[#6B6B6B]">
            <span>Registered Staff</span>
            <Users className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#0A0A0A]">
            {overview?.counts.users ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6B6B6B]">public.profiles</div>
        </div>

        <div className="genesis-card p-5 space-y-1">
          <div className="flex items-center justify-between text-[12px] text-[#6B6B6B]">
            <span>Triaged Devices</span>
            <Database className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#0A0A0A]">
            {devices.length}
          </div>
          <div className="text-[11px] font-mono text-[#6B6B6B]">public.devices</div>
        </div>

        <div className="genesis-card p-5 space-y-1">
          <div className="flex items-center justify-between text-[12px] text-[#6B6B6B]">
            <span>Assessments</span>
            <ShieldCheck className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#0A0A0A]">
            {devices.reduce((acc, d) => acc + d.assessments.length, 0)}
          </div>
          <div className="text-[11px] font-mono text-[#6B6B6B]">
            Append-Only Snapshots
          </div>
        </div>

        <div className="genesis-card p-5 space-y-1">
          <div className="flex items-center justify-between text-[12px] text-[#6B6B6B]">
            <span>Workflow Events</span>
            <KeyRound className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#0A0A0A]">
            {devices.reduce((acc, d) => acc + d.workflowEvents.length, 0)}
          </div>
          <div className="text-[11px] font-mono text-[#6B6B6B]">
            Immutable Audit Log
          </div>
        </div>

        <div className="genesis-card p-5 space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[12px] text-[#6B6B6B]">
            <span>Resend Logs</span>
            <Mail className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#0A0A0A]">
            {overview?.counts.emailEvents ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6B6B6B]">public.email_events</div>
        </div>
      </div>

      {/* Staff & Role Management Table */}
      <section
        aria-label="Staff Role Governance"
        className="genesis-card overflow-hidden"
      >
        <div className="border-b border-[#E8E8EC] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] font-bold text-[#0A0A0A]">
              Staff Directory & Role Access Control (RBAC)
            </h2>
            <p className="text-[12px] text-[#6B6B6B]">
              Role updates execute via the <code className="font-mono text-[#0A0A0A]">public.admin_update_user_profile</code> security-definer RPC.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              className="h-4 w-4 text-[#9C9C9C] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search staff directory"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, or role..."
              className="genesis-input w-full min-h-[44px] pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E8EC] bg-[#FAFAFA] text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-4">Department & Title</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-6 text-right">Admin Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC] text-[13px]">
              {filteredProfiles.map((member) => {
                const selectedRole = pendingRoles[member.id] ?? member.role;
                const isChanged = selectedRole !== member.role;
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#0A0A0A]">
                        {member.displayName}
                      </div>
                      <div className="font-mono text-[12px] text-[#6B6B6B]">
                        {member.email}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-1.5 text-[#0A0A0A] font-medium">
                        <Building2
                          className="h-3.5 w-3.5 text-[#6B6B6B]"
                          aria-hidden="true"
                        />
                        {member.department}
                      </div>
                      <div className="text-[12px] text-[#6B6B6B]">
                        {member.jobTitle}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <RolePill role={member.role} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <select
                          aria-label={`Assign role for ${member.displayName}`}
                          disabled={actor.role !== 'manager'}
                          value={selectedRole}
                          onChange={(e) =>
                            setPendingRoles((prev) => ({
                              ...prev,
                              [member.id]: e.target.value as UserRole,
                            }))
                          }
                          className="genesis-input min-h-[44px] py-1.5 px-3 text-[13px] disabled:opacity-50"
                        >
                          <option value="manager">manager (Admin)</option>
                          <option value="technician">technician (Staff)</option>
                          <option value="viewer">viewer (Auditor)</option>
                        </select>
                        <button
                          type="button"
                          disabled={
                            actor.role !== 'manager' ||
                            !isChanged ||
                            savingUserId === member.id
                          }
                          onClick={() => void handleUpdateUserRole(member)}
                          className="genesis-btn-primary min-h-[44px] px-3.5 py-1.5 text-[12px] disabled:opacity-40 cursor-pointer"
                        >
                          {savingUserId === member.id ? 'Saving...' : 'Update Role'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Resend Operational Summary Trigger & Outbound Email Audit Log */}
      <EmailSummaryPanel
        devices={devices}
        isDemo={isDemo}
        actorRole={actor.role}
      />

      {overview && overview.emailEvents.length > 0 && (
        <section
          aria-label="Outbound Email Audit Log"
          className="genesis-card overflow-hidden"
        >
          <div className="border-b border-[#E8E8EC] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              <h2 className="font-display text-[16px] font-bold text-[#0A0A0A]">
                Resend Outbound Email Audit Trail (public.email_events)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[#6B6B6B]">
              Sender: ReuseFlow &lt;info@ensure.in&gt;
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#E8E8EC] bg-[#FAFAFA] text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Provider ID</th>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8EC]">
                {overview.emailEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#FAFAFA]">
                    <td className="py-3 px-6 font-mono text-[12px] text-[#6B6B6B]">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#0A0A0A]">
                      {ev.recipient}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#6B6B6B]">
                      {ev.providerId ?? '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#6B6B6B]">
                      {ev.idempotencyKey}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase ${
                          ev.status === 'sent'
                            ? 'bg-[#10B981]/15 text-[#065F46]'
                            : 'bg-[#EF4444]/15 text-[#991B1B]'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
