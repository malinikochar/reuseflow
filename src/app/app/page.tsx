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
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
        <div className="max-w-lg w-full genesis-card p-6 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F59E0B]/15 px-3 py-1 text-[12px] font-medium text-[#92400E]">
            <Database className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden="true" />
            Supabase Backend Not Configured in Environment
          </div>
          <h1 className="font-display text-[24px] font-bold text-[#0A0A0A]">
            Authenticated Workspace (/app) Requires Supabase Credentials
          </h1>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            The production <code className="font-mono text-[#0A0A0A]">/app</code> route enforces cookie-based Supabase Auth and Postgres Row-Level Security (<code className="font-mono text-[#0A0A0A]">supabase/migrations/20261028000001_initial_schema_and_rls.sql</code>). To connect a live Supabase instance, configure <code className="font-mono text-[#0A0A0A]">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono text-[#0A0A0A]">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.
          </p>
          <div className="genesis-panel bg-[#FAFAFA] p-4 space-y-2.5">
            <p className="text-[13px] font-medium text-[#0A0A0A] flex items-center gap-1.5">
              <FlaskConical className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
              Evaluating the Hackathon MVP?
            </p>
            <p className="text-[13px] text-[#6B6B6B]">
              Use the isolated public sandbox at <code className="font-mono text-[#0A0A0A]">/demo</code> to test intake, deterministic v1.0.0 assessment, workflow approvals, sanitization gates, and Scenario Lab with zero credentials.
            </p>
            <div className="pt-1 flex flex-wrap gap-2.5">
              <Link
                href="/demo"
                className="genesis-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-[13px]"
              >
                Open Public Sandbox (/demo)
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="genesis-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px]"
              >
                <Lock className="h-3.5 w-3.5 text-[#6B6B6B]" aria-hidden="true" />
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
