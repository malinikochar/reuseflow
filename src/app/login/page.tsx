'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Cpu, FlaskConical, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

export default function LoginPage() {
  const router = useRouter();
  const { isConfigured } = getSupabasePublicConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setErrorMessage(
        'Supabase authentication is not configured in this environment. Use the public /demo sandbox to test all workflows immediately.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push('/app');
      router.refresh();
    } catch {
      setErrorMessage('Unable to complete sign-in request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <header className="border-b border-[#E8E8EC] bg-[#FFFFFF]/90 backdrop-blur-md px-6 h-[56px] flex items-center">
        <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display font-bold text-[18px] text-[#0A0A0A]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#0A0A0A] text-[#FAFAFA]">
              <Cpu className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>ReuseFlow</span>
          </Link>
          <Link
            href="/demo"
            className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px]"
          >
            Open Public Sandbox (/demo)
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">
          {/* Judge Fast-Track Card */}
          <div className="genesis-card p-5 text-[13px] space-y-2.5">
            <div className="flex items-center gap-2 font-display font-bold text-[16px] text-[#0A0A0A]">
              <FlaskConical className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
              Hackathon Judges: No Account Required for /demo
            </div>
            <p className="text-[#6B6B6B] leading-relaxed">
              Evaluating ReuseFlow for FUSE Society Blueprint 2026? The full interactive sandbox with all 6 PRD fixtures, role simulator, and Scenario Lab requires <strong className="text-[#0A0A0A]">zero login</strong>.
            </p>
            <div className="pt-1">
              <Link
                href="/demo"
                className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px]"
              >
                Launch Public Judge Sandbox (/demo)
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Authenticated Staff Sign-In Card */}
          <div className="genesis-card p-6 space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                <Lock className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                Supabase SSR Cookie Authentication
              </div>
              <h1 className="font-display text-[24px] font-bold text-[#0A0A0A]">
                Staff Operations Sign In (/app)
              </h1>
              <p className="text-[13px] text-[#6B6B6B]">
                Sign in with your organization account. Role permissions (<code className="font-mono text-[#0A0A0A]">manager</code>, <code className="font-mono text-[#0A0A0A]">technician</code>, <code className="font-mono text-[#0A0A0A]">viewer</code>) are enforced server-side via Postgres Row-Level Security.
              </p>
            </div>

            {!isConfigured && (
              <div
                role="status"
                className="genesis-panel bg-[#FAFAFA] p-3.5 text-[12px] text-[#6B6B6B] space-y-1"
              >
                <p className="font-medium text-[#0A0A0A]">
                  Supabase Environment Keys Not Configured
                </p>
                <p>
                  Set <code className="font-mono text-[#0A0A0A]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                  <code className="font-mono text-[#0A0A0A]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{' '}
                  <code className="font-mono text-[#0A0A0A]">.env.local</code> or Vercel project settings to enable live database sign-in.
                </p>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="rounded-[6px] border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-[12px] font-medium text-[#991B1B]"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
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
                  placeholder="technician@organization.org"
                  className="genesis-input w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-medium text-[#0A0A0A] mb-1.5"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="genesis-input w-full"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="genesis-btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] disabled:opacity-50 cursor-pointer"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {isLoading ? 'Verifying Credentials...' : 'Sign In to /app'}
              </button>
            </form>

            <div className="pt-3 border-t border-[#E8E8EC] flex items-center gap-2 text-[12px] text-[#9C9C9C]">
              <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
              <span>
                Need role changes or password recovery? Contact your Refurbishment Manager or Supabase project administrator. Self-role promotion is blocked by RLS.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
