import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Database, FlaskConical, Lock } from 'lucide-react';
import { getVerifiedServerActor } from '@/lib/auth/session';
import { AuthenticatedClientWorkspace } from './client-workspace';

export default async function AuthenticatedAppPage() {
  const auth = await getVerifiedServerActor();

  if (auth.status === 'unconfigured') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9f8] p-4 sm:p-6">
        <div className="max-w-lg w-full rounded-xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
            <Database className="h-3.5 w-3.5 text-amber-800" aria-hidden="true" />
            Supabase Backend Not Configured in Environment
          </div>
          <h1 className="text-xl font-bold text-stone-950">
            Authenticated Workspace (/app) Requires Supabase Credentials
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            The production <code className="font-mono">/app</code> route enforces cookie-based Supabase Auth and Postgres Row-Level Security (`supabase/migrations/20261028000001_initial_schema_and_rls.sql`). To connect a live Supabase instance, configure <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.
          </p>
          <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-4 space-y-2">
            <p className="text-xs font-semibold text-teal-950 flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-teal-800" aria-hidden="true" />
              Evaluating the Hackathon MVP?
            </p>
            <p className="text-xs text-teal-900">
              Use the isolated public sandbox at <code className="font-mono">/demo</code> to test intake, deterministic v1.0.0 assessment, workflow approvals, sanitization gates, and Scenario Lab with zero credentials.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Open Public Sandbox (/demo)
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    redirect('/login');
  }

  return <AuthenticatedClientWorkspace actor={auth.actor} />;
}
