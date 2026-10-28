'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  FlaskConical,
  KeyRound,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { ReuseFlowLogo } from '@/components/shared/reuseflow-logo';
import { UserRole } from '@/types/domain';

type AuthMode = 'signin' | 'register';

const ONE_CLICK_ACCOUNTS: Array<{
  label: string;
  roleBadge: string;
  description: string;
  email: string;
  password: string;
  role: UserRole;
}> = [
  {
    label: 'One-Click Admin / Manager Login',
    roleBadge: 'MANAGER / ADMIN',
    description:
      'Full access to Admin Panel, Staff Role Governance, Scenario Lab, Resend Email, & Refurbishment Approvals.',
    email: 'admin@reuseflow.org',
    password: 'AdminPassword123!',
    role: 'manager',
  },
  {
    label: 'One-Click Staff / Technician Login',
    roleBadge: 'TECHNICIAN / STAFF',
    description:
      'Access to Device Intake, Bench Diagnostics, v1.0.0 Assessments, & Sanitization Verification.',
    email: 'tech@reuseflow.org',
    password: 'TechPassword123!',
    role: 'technician',
  },
  {
    label: 'One-Click Read-Only Auditor Login',
    roleBadge: 'VIEWER / AUDITOR',
    description:
      'Read-only access to verify Postgres Row-Level Security (RLS) write-blocking.',
    email: 'viewer@reuseflow.org',
    password: 'ViewerPassword123!',
    role: 'viewer',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { isConfigured } = getSupabasePublicConfig();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('Refurbishment Operations');
  const [jobTitle, setJobTitle] = useState('Refurbishment Specialist');
  const [registerRole, setRegisterRole] = useState<UserRole>('technician');

  const [isLoading, setIsLoading] = useState(false);
  const [activeQuickEmail, setActiveQuickEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Warm the public /demo sandbox route bundle on mount (never prefetch /app while unauthenticated)
  useEffect(() => {
    router.prefetch('/demo');
  }, [router]);

  const executeSignIn = async (targetEmail: string, targetPassword: string) => {
    setErrorMessage(null);
    setInfoMessage(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErrorMessage(
        'Supabase authentication is not configured in this environment. Use the public /demo sandbox to test all workflows immediately.'
      );
      return;
    }

    setIsLoading(true);
    let navigating = false;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: targetEmail.trim(),
        password: targetPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      navigating = true;
      window.location.assign('/app');
    } catch {
      setErrorMessage('Unable to complete sign-in request.');
    } finally {
      if (!navigating) {
        setIsLoading(false);
        setActiveQuickEmail(null);
      }
    }
  };

  const handleQuickLogin = async (acctEmail: string, acctPassword: string) => {
    setEmail(acctEmail);
    setPassword(acctPassword);
    setActiveQuickEmail(acctEmail);
    await executeSignIn(acctEmail, acctPassword);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (mode === 'signin') {
      await executeSignIn(email, password);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErrorMessage('Supabase authentication is not configured.');
      return;
    }

    setIsLoading(true);
    let navigating = false;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            department: department.trim(),
            job_title: jobTitle.trim(),
            role: registerRole,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // If session is returned immediately (auto-confirmed via trigger), redirect to /app
      if (data.session) {
        navigating = true;
        window.location.assign('/app');
        return;
      }

      // Otherwise sign in immediately using the newly created account
      const signInRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInRes.error) {
        setInfoMessage(
          'Account registered! Please sign in with your email and password.'
        );
        setMode('signin');
        return;
      }

      navigating = true;
      window.location.assign('/app');
    } catch {
      setErrorMessage('Unable to complete account registration.');
    } finally {
      if (!navigating) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      <header className="sticky top-0 z-20 border-b border-[#E5E5EA]/80 bg-[#FFFFFF]/80 backdrop-blur-2xl px-4 sm:px-6 min-h-[64px] flex items-center">
        <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="focus:outline-none">
              <ReuseFlowLogo
                size="sm"
                showVersion
                subtitle="Staff Authentication & Role Governance"
              />
            </Link>
            <nav
              aria-label="Auth Navigation"
              className="hidden md:flex items-center gap-1 text-[13px] font-medium text-[#6E6E73]"
            >
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 hover:bg-[#F2F2F7] hover:text-[#1D1D1F] transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/demo"
                className="rounded-lg px-3 py-1.5 hover:bg-[#F2F2F7] hover:text-[#1D1D1F] transition-colors"
              >
                Public Sandbox (/demo)
              </Link>
            </nav>
          </div>
          <Link
            href="/demo"
            className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-[13px]"
          >
            Open Public Sandbox (/demo)
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-[1140px] w-full mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: One-Click Hackathon Logins & Judge Fast-Track */}
          <div className="lg:col-span-6 space-y-5">
            <div className="genesis-card p-6 space-y-4 border-[#6366F1]/25">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#4F46E5]">
                  <Sparkles className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                  Hackathon Instant Access · Live Supabase DB
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-[#10B981]">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                  Live Connected
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.03em] text-[#1D1D1F]">
                  One-Click Demo Login (/app)
                </h2>
                <p className="text-[13px] text-[#6E6E73] leading-relaxed">
                  Test the live Supabase database, User Profile Management, Admin Panel, and Resend email workflow immediately with pre-seeded staff accounts:
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {ONE_CLICK_ACCOUNTS.map((acct) => {
                  const isThisLoading = activeQuickEmail === acct.email && isLoading;
                  return (
                    <div
                      key={acct.email}
                      className="genesis-panel bg-[#FAFAFC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#6366F1]/45 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-bold text-[14px] text-[#1D1D1F]">
                            {acct.label}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium uppercase ${
                              acct.role === 'manager'
                                ? 'bg-[#6366F1]/15 text-[#4F46E5]'
                                : acct.role === 'technician'
                                  ? 'bg-[#10B981]/15 text-[#065F46]'
                                  : 'bg-[#E5E5EA] text-[#6E6E73]'
                            }`}
                          >
                            {acct.roleBadge}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6E6E73] leading-snug">
                          {acct.description}
                        </p>
                        <div className="font-mono text-[11px] text-[#86868B]">
                          {acct.email}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => void handleQuickLogin(acct.email, acct.password)}
                        className={
                          acct.role === 'manager'
                            ? 'genesis-btn-primary shrink-0 min-h-[44px] px-4 py-2 text-[13px] inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50'
                            : 'genesis-btn-secondary shrink-0 min-h-[44px] px-4 py-2 text-[13px] inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50'
                        }
                      >
                        {isThisLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : acct.role === 'manager' ? (
                          <ShieldCheck className="h-4 w-4 text-[#FAFAFA]" aria-hidden="true" />
                        ) : acct.role === 'technician' ? (
                          <UserCheck className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                        ) : (
                          <Shield className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                        )}
                        {isThisLoading
                          ? 'Opening Workspace...'
                          : acct.role === 'manager'
                            ? 'Login as Admin'
                            : acct.role === 'technician'
                              ? 'Login as Staff'
                              : 'Login as Viewer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Browser-Local Judge Sandbox Card */}
            <div className="genesis-card p-5 text-[13px] space-y-2.5">
              <div className="flex items-center gap-2 font-display font-bold text-[16px] text-[#1D1D1F]">
                <FlaskConical className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
                Zero-Login Browser Sandbox (/demo)
              </div>
              <p className="text-[#6E6E73] leading-relaxed">
                Prefer to test offline in an isolated browser-local sandbox? The{' '}
                <code className="font-mono text-[#1D1D1F]">/demo</code> route runs all 6 PRD fixtures, role simulator, and Scenario Lab with zero network dependencies.
              </p>
              <div className="pt-1">
                <Link
                  href="/demo"
                  className="genesis-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-[13px]"
                >
                  Launch Public Judge Sandbox (/demo)
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In & User Registration Card */}
          <div className="lg:col-span-6 genesis-card p-6 space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F2F2F7] border border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className={`min-h-[42px] rounded-lg text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#FFFFFF] text-[#1D1D1F] shadow-xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <KeyRound className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
                Staff Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className={`min-h-[42px] rounded-lg text-[13px] font-medium inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#FFFFFF] text-[#1D1D1F] shadow-xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <UserPlus className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
                Create Account
              </button>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#6E6E73]">
                <Lock className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                Supabase SSR Cookie Authentication
              </div>
              <h1 className="font-display text-[24px] font-bold text-[#1D1D1F]">
                {mode === 'signin'
                  ? 'Staff Operations Sign In (/app)'
                  : 'Register New Staff Account'}
              </h1>
              <p className="text-[13px] text-[#6E6E73]">
                {mode === 'signin'
                  ? 'Sign in with your organization account or use the One-Click Demo Login buttons.'
                  : 'Create a live Supabase account with automatic profile provisioning and role assignment.'}
              </p>
            </div>

            {!isConfigured && (
              <div
                role="status"
                className="genesis-panel bg-[#FAFAFC] p-3.5 text-[12px] text-[#6E6E73] space-y-1"
              >
                <p className="font-medium text-[#1D1D1F]">
                  Supabase Environment Keys Not Configured
                </p>
                <p>
                  Set <code className="font-mono text-[#1D1D1F]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                  <code className="font-mono text-[#1D1D1F]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable live database sign-in.
                </p>
              </div>
            )}

            {infoMessage && (
              <div
                role="status"
                className="rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 p-3 text-[12px] font-medium text-[#065F46]"
              >
                {infoMessage}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-[12px] font-medium text-[#991B1B]"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="register-display-name"
                      className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="register-display-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Taylor Brooks"
                      className="genesis-input w-full min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="register-department"
                        className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                      >
                        Department
                      </label>
                      <input
                        id="register-department"
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="genesis-input w-full min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="register-role"
                        className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                      >
                        Initial Role (Self-Signup)
                      </label>
                      <select
                        id="register-role"
                        value={registerRole}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          setRegisterRole(r);
                          setJobTitle(
                            r === 'technician'
                              ? 'Refurbishment Technician'
                              : 'Impact Auditor'
                          );
                        }}
                        className="genesis-input w-full min-h-[44px]"
                      >
                        <option value="technician">Technician / Staff</option>
                        <option value="viewer">Viewer / Auditor</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Staff Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@reuseflow.org"
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="genesis-input w-full min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="genesis-btn-primary w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : mode === 'signin' ? (
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                )}
                {mode === 'signin'
                  ? isLoading
                    ? 'Opening /app Workspace...'
                    : 'Sign In to /app'
                  : isLoading
                    ? 'Creating Staff Account...'
                    : 'Create Account & Enter /app'}
              </button>
            </form>

            <div className="pt-3 border-t border-[#E5E5EA] flex items-center gap-2 text-[12px] text-[#6E6E73]">
              <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
              <span>
                Role permissions (<code className="font-mono text-[#1D1D1F]">manager</code>,{' '}
                <code className="font-mono text-[#1D1D1F]">technician</code>,{' '}
                <code className="font-mono text-[#1D1D1F]">viewer</code>) are enforced server-side via Postgres Row-Level Security.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
