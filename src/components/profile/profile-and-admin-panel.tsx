'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
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
  changeMyPasswordServerAction,
  getAdminSystemOverviewServerAction,
  getMyProfileServerAction,
  updateMyProfileServerAction,
} from '@/lib/actions/profile-admin-actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { EmailSummaryPanel } from '@/components/analytics/email-summary-card';

const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'demo-mgr-1',
    email: 'admin@reuseflow.org',
    displayName: 'Morgan Chen (Operations Manager & Admin)',
    department: 'Refurbishment Governance & Admin',
    jobTitle: 'Refurbishment Operations Manager',
    phone: '+1 (503) 555-0140',
    location: 'Portland Central Triage Hub',
    bio: 'Leads refurbishment margin governance, safety quarantine sign-offs, and NIST 800-88 audit compliance.',
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
    phone: '+1 (503) 555-0182',
    location: 'Main Refurbishment Bench #2',
    bio: 'Specializes in ThinkPad/Latitude board diagnostics, battery safety screening, and external drive wipe verification.',
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
    phone: '+1 (503) 555-0199',
    location: 'Operations Analytics Office',
    bio: 'Audits refurbishment yield, cost recovery waterfalls, and Scenario Lab capacity models.',
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
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Main Refurbishment Bench');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
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
        setPhone(match.phone ?? '');
        setLocation(match.location ?? 'Main Refurbishment Bench');
        setBio(match.bio ?? '');
        return;
      }

      const res = await getMyProfileServerAction();
      if (res.ok) {
        setProfile(res.data);
        setDisplayName(res.data.displayName);
        setDepartment(res.data.department);
        setJobTitle(res.data.jobTitle);
        setPhone(res.data.phone ?? '');
        setLocation(res.data.location ?? 'Main Refurbishment Bench');
        setBio(res.data.bio ?? '');
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
          phone: phone.trim(),
          location: location.trim(),
          bio: bio.trim(),
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
        phone,
        location,
        bio,
      });

      if (res.ok) {
        setProfile(res.data);
        onActorNameUpdated?.(res.data.displayName);
        setFeedback({
          type: 'success',
          text: 'Your staff profile has been saved to your separate account in Supabase public.profiles.',
        });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        text: 'New password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        text: 'New password and confirmation password do not match.',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      if (isDemo) {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordFeedback({
          type: 'success',
          text: 'Sandbox password update simulated (no live account modified in /demo).',
        });
        return;
      }

      const res = await changeMyPasswordServerAction({ newPassword });
      if (!res.ok) {
        setPasswordFeedback({ type: 'error', text: res.message });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.updateUser({ password: newPassword });
      }

      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({
        type: 'success',
        text: 'Your account password has been updated in Supabase and a security confirmation email was sent via Resend.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] sm:text-[32px] font-bold tracking-[-0.03em] text-[#1D1D1F]">
            Staff Profile & RBAC Permissions
          </h1>
          <p className="text-[14px] text-[#6E6E73]">
            Manage your personal profile details, change your account password, and inspect your isolated account workspace settings.
          </p>
        </div>
        {profile && <RolePill role={profile.role} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Extended Profile Editor Form */}
        <section
          aria-label="Edit Staff Profile"
          className="lg:col-span-7 genesis-card overflow-hidden"
        >
          <div className="border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              <h2 className="font-display text-[16px] font-bold text-[#1D1D1F]">
                Personal & Operational Identity
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[#6E6E73]">
              {isDemo ? 'Sandbox Profile' : 'Supabase public.profiles'}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            {feedback && (
              <div
                role="status"
                className={`rounded-xl border p-3 text-[13px] font-medium flex items-center gap-2 ${
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
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Authenticated Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={profile?.email ?? 'staff@reuseflow.org'}
                  className="genesis-input w-full min-h-[44px] bg-[#F5F5F7] text-[#6E6E73] cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-role"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Assigned Security Role (RLS Enforced)
                </label>
                <input
                  id="profile-role"
                  type="text"
                  disabled
                  value={(profile?.role ?? actor.role).toUpperCase()}
                  className="genesis-input w-full min-h-[44px] font-mono bg-[#F5F5F7] text-[#6E6E73] cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-display-name"
                className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
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
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
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
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#6E6E73]" aria-hidden="true" />
                    Contact Phone (Optional)
                  </span>
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  maxLength={40}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (503) 555-0140"
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-location"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#6E6E73]" aria-hidden="true" />
                    Facility / Bench Location
                  </span>
                </label>
                <input
                  id="profile-location"
                  type="text"
                  maxLength={80}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Main Refurbishment Bench"
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
              >
                Technician Bio & Operational Notes
              </label>
              <textarea
                id="profile-bio"
                rows={2}
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Hardware specialties, bench certifications, or shift notes..."
                className="genesis-input w-full"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E5EA]">
              <span className="text-[12px] text-[#6E6E73]">
                Account ID:{' '}
                <code className="font-mono text-[#1D1D1F]">
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

        {/* Right Column: Change Password Card + RBAC & Isolated Account Data Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Change Account Password Card */}
          <section
            aria-label="Change Account Password"
            className="genesis-card overflow-hidden"
          >
            <div className="border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
                <h2 className="font-display text-[16px] font-bold text-[#1D1D1F]">
                  Change Account Password
                </h2>
              </div>
              <span className="font-mono text-[11px] text-[#10B981]">
                auth.users + Resend Notice
              </span>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordFeedback && (
                <div
                  role="status"
                  className={`rounded-xl border p-3 text-[12px] font-medium flex items-start gap-2 ${
                    passwordFeedback.type === 'success'
                      ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#065F46]'
                      : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#991B1B]'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{passwordFeedback.text}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="profile-new-password"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-confirm-password"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="genesis-btn-primary w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] disabled:opacity-50 cursor-pointer"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {isChangingPassword
                  ? 'Updating Password...'
                  : 'Update Account Password'}
              </button>
            </form>
          </section>

          {/* Separate User Account Isolation & RLS Matrix */}
          <section
            aria-label="Role Permissions Matrix"
            className="genesis-card p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
              <h2 className="font-display text-[16px] font-bold text-[#1D1D1F]">
                Per-User Account Isolation & RLS
              </h2>
            </div>
            <p className="text-[13px] text-[#6E6E73] leading-relaxed">
              Every user account stores its own isolated devices (<code className="font-mono text-[#1D1D1F]">public.devices</code>), append-only assessments, workflow events, and personal Scenario Lab thresholds (<code className="font-mono text-[#1D1D1F]">public.user_settings</code>) keyed by <code className="font-mono text-[#1D1D1F]">auth.uid()</code>.
            </p>

            <div className="space-y-2.5 text-[12px]">
              <div className="genesis-panel bg-[#FAFAFC] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[#1D1D1F]">
                    Manager / Admin
                  </span>
                  <span className="font-mono text-[11px] text-[#6366F1]">Full Access</span>
                </div>
                <p className="text-[#6E6E73]">
                  Approves refurbishments, releases quarantine, closes dispositions, triggers Resend summary emails, and manages staff roles in the Admin Panel.
                </p>
              </div>

              <div className="genesis-panel bg-[#FAFAFC] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-[#1D1D1F]">
                    Technician / Staff
                  </span>
                  <span className="font-mono text-[11px] text-[#10B981]">
                    Bench Operations
                  </span>
                </div>
                <p className="text-[#6E6E73]">
                  Logs device intake, edits bench specs, runs v1.0.0 assessments, customizes personal Scenario Lab thresholds, and records external sanitization verification.
                </p>
              </div>
            </div>
          </section>
        </div>
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
          <h1 className="font-display text-[24px] sm:text-[32px] font-bold tracking-[-0.03em] text-[#1D1D1F]">
            Admin Panel & System Governance
          </h1>
          <p className="text-[14px] text-[#6E6E73]">
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
          className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-4 text-[13px] text-[#92400E] flex items-center gap-2.5"
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
          className={`rounded-xl border p-4 text-[13px] font-medium flex items-center justify-between gap-3 ${
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
          <div className="flex items-center justify-between text-[12px] text-[#6E6E73]">
            <span>Registered Staff</span>
            <Users className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#1D1D1F]">
            {overview?.counts.users ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6E6E73]">public.profiles</div>
        </div>

        <div className="genesis-card p-5 space-y-1">
          <div className="flex items-center justify-between text-[12px] text-[#6E6E73]">
            <span>Account Devices</span>
            <Database className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#1D1D1F]">
            {devices.length}
          </div>
          <div className="text-[11px] font-mono text-[#6E6E73]">public.devices</div>
        </div>

        <div className="genesis-card p-5 space-y-1">
          <div className="flex items-center justify-between text-[12px] text-[#6E6E73]">
            <span>Assessments</span>
            <ShieldCheck className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#1D1D1F]">
            {devices.reduce((acc, d) => acc + d.assessments.length, 0)}
          </div>
          <div className="text-[11px] font-mono text-[#6E6E73]">
            Append-Only Snapshots
          </div>
        </div>

        <div className="genesis-card p-5 space-y-1">
          <div className="flex items-center justify-between text-[12px] text-[#6E6E73]">
            <span>Workflow Events</span>
            <KeyRound className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#1D1D1F]">
            {devices.reduce((acc, d) => acc + d.workflowEvents.length, 0)}
          </div>
          <div className="text-[11px] font-mono text-[#6E6E73]">
            Immutable Audit Log
          </div>
        </div>

        <div className="genesis-card p-5 space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[12px] text-[#6E6E73]">
            <span>Resend Logs</span>
            <Mail className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
          </div>
          <div className="font-display text-[28px] font-bold text-[#1D1D1F]">
            {overview?.counts.emailEvents ?? 0}
          </div>
          <div className="text-[11px] font-mono text-[#6E6E73]">public.email_events</div>
        </div>
      </div>

      {/* Staff & Role Management Table */}
      <section
        aria-label="Staff Role Governance"
        className="genesis-card overflow-hidden"
      >
        <div className="border-b border-[#E5E5EA] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display text-[18px] font-bold text-[#1D1D1F]">
              Staff Directory & Role Access Control (RBAC)
            </h2>
            <p className="text-[12px] text-[#6E6E73]">
              Role updates execute via the <code className="font-mono text-[#1D1D1F]">public.admin_update_user_profile</code> security-definer RPC.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              className="h-4 w-4 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2"
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
              <tr className="border-b border-[#E5E5EA] bg-[#FAFAFC] text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-4">Department & Title</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-6 text-right">Admin Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] text-[13px]">
              {filteredProfiles.map((member) => {
                const selectedRole = pendingRoles[member.id] ?? member.role;
                const isChanged = selectedRole !== member.role;
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-[#FAFAFC] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#1D1D1F]">
                        {member.displayName}
                      </div>
                      <div className="font-mono text-[12px] text-[#6E6E73]">
                        {member.email}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-1.5 text-[#1D1D1F] font-medium">
                        <Building2
                          className="h-3.5 w-3.5 text-[#6E6E73]"
                          aria-hidden="true"
                        />
                        {member.department}
                      </div>
                      <div className="text-[12px] text-[#6E6E73]">
                        {member.jobTitle}
                        {member.location ? ` · ${member.location}` : ''}
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
          <div className="border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              <h2 className="font-display text-[16px] font-bold text-[#1D1D1F]">
                Resend Outbound Email Audit Trail (public.email_events)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[#6E6E73]">
              Sender: ReuseFlow &lt;info@ensure.in&gt;
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#FAFAFC] text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Provider ID</th>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {overview.emailEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#FAFAFC]">
                    <td className="py-3 px-6 font-mono text-[12px] text-[#6E6E73]">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#1D1D1F]">
                      {ev.recipient}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#6E6E73]">
                      {ev.providerId ?? '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#6E6E73]">
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
