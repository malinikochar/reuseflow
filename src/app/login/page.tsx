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
    <div className="min-h-screen flex flex-col bg-[#f8f9f8] text-stone-900">
      <header className="border-b border-stone-200 bg-white px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-stone-950">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-900 text-white">
              <Cpu className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>ReuseFlow</span>
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            Open Public Sandbox (/demo)
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          {/* Judge Fast-Track Card */}
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <FlaskConical className="h-4 w-4 text-amber-800 shrink-0" aria-hidden="true" />
              Hackathon Judges: No Account Required for /demo
            </div>
            <p className="text-amber-900 leading-relaxed">
              Evaluating ReuseFlow for FUSE Society Blueprint 2026? The full interactive sandbox with all 6 PRD fixtures, role simulator, and Scenario Lab requires <strong>zero login</strong>.
            </p>
            <div>
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 hover:bg-amber-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
              >
                Launch Public Judge Sandbox (/demo)
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Authenticated Staff Sign-In Card */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Supabase SSR Cookie Authentication
              </div>
              <h1 className="text-xl font-bold text-stone-950">
                Staff Operations Sign In (/app)
              </h1>
              <p className="text-xs text-stone-600">
                Sign in with your organization account. Role permissions (<code className="font-mono">manager</code>, <code className="font-mono">technician</code>, <code className="font-mono">viewer</code>) are enforced server-side via Postgres Row-Level Security.
              </p>
            </div>

            {!isConfigured && (
              <div
                role="status"
                className="rounded-lg border border-stone-300 bg-stone-100 p-3.5 text-xs text-stone-800 space-y-1"
              >
                <p className="font-semibold">
                  Supabase Environment Keys Not Configured
                </p>
                <p className="text-stone-600">
                  Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                  <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{' '}
                  <code className="font-mono">.env.local</code> or Vercel project settings to enable live database sign-in.
                </p>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-900"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-stone-800 mb-1"
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
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {isLoading ? 'Verifying Credentials...' : 'Sign In to /app'}
              </button>
            </form>

            <div className="pt-3 border-t border-stone-200 flex items-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="h-4 w-4 text-teal-800 shrink-0" aria-hidden="true" />
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
