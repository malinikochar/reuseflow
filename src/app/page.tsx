import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  FlaskConical,
  HardDrive,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9f8] text-stone-900">
      {/* Top Disclosure Ribbon */}
      <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-400" />
            <strong>FUSE Society Blueprint 2026 Prototype</strong> — Proposed internal refurbishment decision-support workflow.
          </span>
          <span className="text-stone-400">
            All sample metrics are fictional · Thresholds are configurable hypotheses
          </span>
        </div>
      </div>

      {/* Navigation */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-900 text-white shadow-2xs">
              <Cpu className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="font-bold text-lg tracking-tight text-stone-950">
                ReuseFlow
              </span>
              <span className="hidden sm:inline-block ml-2 rounded bg-stone-100 border border-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                Rule Engine v1.0.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-800 transition-colors"
            >
              Staff Sign In (/app)
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors"
            >
              Try Interactive Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="border-b border-stone-200 bg-white py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-800/30 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-950">
                <FlaskConical className="h-3.5 w-3.5 text-teal-800" aria-hidden="true" />
                Zero-Login Public Judge Sandbox Ready
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-950 leading-[1.12]">
                Turn donated electronics into transparent, human-approved refurbishment decisions.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                ReuseFlow standardizes intake triage with a versioned, explainable repair-economics rule engine, pre-economic battery safety quarantine, external sanitization verification gates, and an interactive Scenario Lab.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-800 hover:bg-teal-900 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-sm transition-colors"
                >
                  Try Interactive Demo (/demo)
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 px-5 py-3.5 text-sm sm:text-base font-semibold text-stone-800 transition-colors"
                >
                  <Lock className="h-4 w-4 text-stone-600" aria-hidden="true" />
                  Authenticated Staff App (/app)
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-200 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-800 shrink-0" aria-hidden="true" />
                  <span>Deterministic Cents Math (No Fake AI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>Swollen Battery Safety Quarantine</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-800 shrink-0" aria-hidden="true" />
                  <span>Human Approval & Sanitization Gates</span>
                </div>
              </div>
            </div>

            {/* Right Preview Card: Worked Case A */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-stone-300 bg-[#f8f9f8] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-900">
                      FG-DEMO-101 · Case A Fixture
                    </span>
                    <h2 className="text-base font-bold text-stone-950">
                      Lenovo ThinkPad T480 (8GB / 256GB)
                    </h2>
                  </div>
                  <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                    Refurbish Candidate
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-lg bg-white border border-stone-200 p-2.5">
                    <span className="text-stone-500">Parts + 45m Labor</span>
                    <p className="mt-0.5 text-sm font-bold text-stone-900">$35.00</p>
                  </div>
                  <div className="rounded-lg bg-white border border-stone-200 p-2.5">
                    <span className="text-stone-500">Comparable Value</span>
                    <p className="mt-0.5 text-sm font-bold text-stone-900">$180.00</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                    <span className="text-emerald-800">Est. Net Margin</span>
                    <p className="mt-0.5 text-sm font-bold text-emerald-950">+$145.00</p>
                  </div>
                </div>

                <div className="rounded-lg bg-white border border-stone-200 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800">
                      Triggered Rule: <code className="font-mono">VIABLE_COST_AND_FUNCTION</code>
                    </span>
                    <span className="text-stone-500 font-mono">v1.0.0</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    Device boots, is repairable, meets 8 GB laptop RAM heuristic, and clears the $20.00 minimum margin assumption. Requires human manager approval.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-stone-600">
                  <span>Ready to test all 6 PRD edge cases live?</span>
                  <Link
                    href="/demo"
                    className="font-bold text-teal-800 hover:text-teal-950 underline"
                  >
                    Open /demo sandbox →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-stone-950">
              How ReuseFlow Supports Refurbishment Operations in 3 Steps
            </h2>
            <p className="text-sm text-stone-600">
              The system never replaces technicians or automates physical disposal; it standardizes triage criteria and records an auditable trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-900/10 text-teal-900">
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-stone-950">
                1. 90-Second Validated Intake & Safety Check
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Technicians record device category, RAM/storage, boot state, battery safety, and parts/labor estimates. Swollen batteries trigger immediate <code className="font-mono">QUARANTINE</code> before any economic calculation.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-900/10 text-teal-900">
                <Sliders className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-stone-950">
                2. Explainable Rule Engine v1.0.0
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Every assessment stores an immutable snapshot with stable reason codes, integer-cents cost breakdown, and a non-destructive &ldquo;What-If?&rdquo; parts simulator. Missing critical inputs return <code className="font-mono">INSUFFICIENT_DATA</code> rather than guessing zero.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-2xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-900/10 text-teal-900">
                <HardDrive className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-stone-950">
                3. Human Manager Approval & Sanitization Gate
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Managers review recommendations and append workflow events. Storage-bearing devices cannot be marked <code className="font-mono">ready</code> or <code className="font-mono">closed</code> until external data sanitization is verified and logged.
              </p>
            </div>
          </div>
        </section>

        {/* Scenario Lab & Integrity Guardrails Callout */}
        <section className="border-t border-stone-200 bg-white py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-stone-200 bg-[#f8f9f8] p-6 space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <Calculator className="h-4 w-4" aria-hidden="true" />
                Transparent Scenario Lab (No Invented Impact Claims)
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Every dollar of modelled capacity in the Scenario Lab is traceable to an editable input (monthly device volume, baseline vs. target assessment minutes, hourly labor rate, and implementation/software costs). No unverified carbon or market-scraping claims are made.
              </p>
            </div>

            <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <ShieldAlert className="h-4 w-4 text-amber-800" aria-hidden="true" />
                Scope & Operational Honesty Disclosure
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                ReuseFlow is a hackathon MVP for a proposed refurbishment triage workflow. It does <strong>not</strong> perform certified data wiping or automated device disposal, and sample data in <code className="font-mono">/demo</code> are 100% synthetic.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-stone-900 text-stone-400 py-6 px-4 sm:px-6 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>ReuseFlow · FUSE Society Blueprint 2026 Hackathon MVP</span>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-stone-200 hover:underline">
              Interactive Demo (/demo)
            </Link>
            <Link href="/app" className="text-stone-200 hover:underline">
              Staff App (/app)
            </Link>
            <Link href="/login" className="text-stone-200 hover:underline">
              Sign In (/login)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
