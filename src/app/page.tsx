import React from 'react';
import Link from 'next/link';
import {
  Activity,
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
  Sparkles,
} from 'lucide-react';
import { ReuseFlowLogo } from '@/components/shared/reuseflow-logo';

export default function LandingPage() {
  // Worked Case A telemetry for SVG ring (Margin $145 / Comparable $180 = 80.6% net recovery)
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const recoveryPct = 80.6;
  const ringDashOffset = ringCircumference * (1 - recoveryPct / 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      {/* Top Disclosure Ribbon */}
      <div className="bg-[#FFFFFF]/90 border-b border-[#E5E5EA] text-[#6E6E73] px-6 py-2 text-[12px]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-medium text-[#1D1D1F]">
              FUSE Society Blueprint 2026 Prototype
            </span>{' '}
            — Proposed internal refurbishment decision-support workflow.
          </span>
          <span className="text-[#86868B]">
            Not an official Free Geek system · All sample metrics are fictional
          </span>
        </div>
      </div>

      {/* Apple-Style Translucent Frosted Sticky Top Navigation (Anchor links removed per user request) */}
      <header className="sticky top-0 z-20 border-b border-[#E5E5EA]/80 bg-[#FFFFFF]/80 backdrop-blur-2xl">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="focus:outline-none">
              <ReuseFlowLogo
                size="sm"
                showVersion
                subtitle="Refurbishment Decision Engine"
              />
            </Link>

            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-[#6E6E73]"
            >
              <Link
                href="/demo"
                className="rounded-lg px-3.5 py-1.5 hover:bg-[#F2F2F7] hover:text-[#1D1D1F] transition-colors"
              >
                Public Sandbox (/demo)
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 hover:bg-[#F2F2F7] hover:text-[#1D1D1F] transition-colors"
              >
                Staff Portal (/app)
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="genesis-btn-secondary inline-flex items-center px-3.5 py-2 min-h-[40px] text-[13px]"
            >
              One-Click Login (/app)
            </Link>
            <Link
              href="/demo"
              className="genesis-btn-primary inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-[13px]"
            >
              Try Interactive Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Apple.com Bento Telemetry Card */}
      <main className="flex-1">
        <section className="genesis-dot-grid border-b border-[#E5E5EA] py-12 sm:py-16 px-6">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF]/90 border border-[#E5E5EA] shadow-2xs px-3.5 py-1.5 text-[12px] font-medium text-[#1D1D1F]">
                <FlaskConical className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                <span>Zero-Login Public Judge Sandbox Ready</span>
                <span className="h-1 w-1 rounded-full bg-[#86868B]" />
                <span className="text-[#4F46E5] font-semibold inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Tavily + Nebius AI Copilot
                </span>
              </div>

              <h1 className="font-display text-[36px] sm:text-[54px] font-bold tracking-[-0.035em] text-[#1D1D1F] leading-[1.06]">
                Turn donated electronics into transparent, human-approved refurbishment decisions.
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#6E6E73] leading-relaxed max-w-2xl">
                ReuseFlow standardizes intake triage with a versioned, explainable repair-economics rule engine, pre-economic battery safety quarantine, external sanitization verification gates, and an interactive Scenario Lab.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/demo"
                  className="genesis-btn-primary min-h-[46px] inline-flex items-center gap-2 px-6 py-3 text-[15px]"
                >
                  Try Interactive Demo (/demo)
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="genesis-btn-secondary bg-[#FFFFFF] min-h-[46px] inline-flex items-center gap-2 px-5 py-3 text-[15px]"
                >
                  <Lock className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
                  One-Click Admin & Staff Login (/app)
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E5E5EA] text-[12px] text-[#6E6E73]">
                <div className="flex items-center gap-2 bg-[#FFFFFF]/70 rounded-xl px-3 py-2 border border-[#E5E5EA]/70">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
                  <span className="font-medium text-[#1D1D1F]">Deterministic Cents Math</span>
                </div>
                <div className="flex items-center gap-2 bg-[#FFFFFF]/70 rounded-xl px-3 py-2 border border-[#E5E5EA]/70">
                  <ShieldAlert className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
                  <span className="font-medium text-[#1D1D1F]">Swollen Battery Quarantine</span>
                </div>
                <div className="flex items-center gap-2 bg-[#FFFFFF]/70 rounded-xl px-3 py-2 border border-[#E5E5EA]/70">
                  <ShieldCheck className="h-4 w-4 text-[#6366F1] shrink-0" aria-hidden="true" />
                  <span className="font-medium text-[#1D1D1F]">Human Sanitization Gate</span>
                </div>
              </div>
            </div>

            {/* Right Preview Card: Apple-Style Bento Telemetry Card for Worked Case A */}
            <div className="lg:col-span-5">
              <div className="genesis-card genesis-card-interactive p-6 space-y-5 relative overflow-hidden">
                <div className="flex items-start justify-between border-b border-[#E5E5EA] pb-4 gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#6E6E73]">
                      <Cpu className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                      FG-DEMO-101 · Case A Telemetry
                    </div>
                    <h2 className="font-display text-[19px] font-bold text-[#1D1D1F] mt-0.5">
                      Lenovo ThinkPad T480 (8GB / 256GB)
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#10B981]/12 border border-[#10B981]/30 px-3 py-1 text-[12px] font-semibold text-[#065F46] shrink-0">
                    Refurbish Candidate
                  </span>
                </div>

                {/* Apple Health-Inspired Radial Margin Yield Gauge + Live Cost Bars */}
                <div className="grid grid-cols-12 gap-4 items-center bg-[#FAFAFC] rounded-2xl p-4 border border-[#E5E5EA]">
                  <div className="col-span-5 flex flex-col items-center justify-center border-r border-[#E5E5EA] pr-3">
                    <div className="relative h-24 w-24 flex items-center justify-center">
                      <svg
                        viewBox="0 0 96 96"
                        className="h-24 w-24 -rotate-90"
                        aria-label="80.6 percent net value recovery ring"
                      >
                        <circle
                          cx="48"
                          cy="48"
                          r={ringRadius}
                          fill="none"
                          stroke="#E5E5EA"
                          strokeWidth="8"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r={ringRadius}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringDashOffset}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-display text-[18px] font-bold text-[#1D1D1F] leading-none">
                          81%
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#065F46] mt-0.5">
                          Net Yield
                        </span>
                      </div>
                    </div>
                    <span className="mt-1.5 text-[11px] font-medium text-[#6E6E73]">
                      Value Recovery Ratio
                    </span>
                  </div>

                  {/* Horizontal Apple-Style Telemetry Bars */}
                  <div className="col-span-7 space-y-2.5 text-[12px]">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#6E6E73]">Comparable Value</span>
                        <span className="font-mono font-semibold text-[#1D1D1F]">$180.00</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
                        <div className="h-full rounded-full bg-[#6366F1] w-full" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#6E6E73]">Parts + 45m Labor + OH</span>
                        <span className="font-mono font-semibold text-[#1D1D1F]">$35.00</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
                        <div className="h-full rounded-full bg-[#F59E0B] w-[19.4%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-[#065F46]">Est. Net Margin</span>
                        <span className="font-mono font-bold text-[#065F46]">+$145.00</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
                        <div className="h-full rounded-full bg-[#10B981] w-[80.6%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="genesis-panel bg-[#FFFFFF] p-3.5 space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1D1D1F] inline-flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                      Triggered Rule:{' '}
                      <code className="font-mono text-[#1D1D1F]">
                        VIABLE_COST_AND_FUNCTION
                      </code>
                    </span>
                    <span className="text-[#86868B] font-mono">v1.0.0</span>
                  </div>
                  <p className="text-[#6E6E73] leading-relaxed">
                    Device boots, is repairable, meets 8 GB laptop RAM heuristic, and clears the $20.00 minimum margin assumption. Requires human manager approval.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[13px] text-[#6E6E73]">
                  <span>Ready to test all 6 PRD edge cases live?</span>
                  <Link
                    href="/demo"
                    className="font-semibold text-[#6366F1] hover:text-[#4F46E5] inline-flex items-center gap-1"
                  >
                    Open /demo sandbox →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow Bento Grid Section */}
        <section
          id="workflow-architecture"
          className="py-12 sm:py-16 px-6 max-w-[1280px] mx-auto space-y-8"
        >
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6366F1]">
              Bento Architecture
            </p>
            <h2 className="font-display text-[32px] font-bold tracking-[-0.03em] text-[#1D1D1F]">
              How ReuseFlow Supports Refurbishment Operations in 3 Steps
            </h2>
            <p className="text-[15px] text-[#6E6E73]">
              The system never replaces technicians or automates physical disposal; it standardizes triage criteria and records an auditable trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="genesis-card genesis-card-interactive p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366F1]/15 to-[#6366F1]/5 border border-[#6366F1]/20 text-[#4F46E5]">
                    <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 font-mono text-[11px] text-[#6E6E73]">
                    Step 01 · ≤ 90s
                  </span>
                </div>
                <h3 className="font-display text-[18px] font-bold text-[#1D1D1F]">
                  1. 90-Second Validated Intake & Safety Check
                </h3>
                <p className="text-[14px] text-[#6E6E73] leading-relaxed">
                  Technicians record device category, RAM/storage, boot state, battery safety, and parts/labor estimates. Swollen batteries trigger immediate <code className="font-mono text-[#1D1D1F]">QUARANTINE</code> before any economic calculation.
                </p>
              </div>
              <div className="rounded-xl bg-[#FAFAFC] border border-[#E5E5EA] px-3.5 py-2.5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#6E6E73]">Gate 1: Battery Safety</span>
                <span className="text-[#F59E0B] font-semibold">Pre-Economic Override</span>
              </div>
            </div>

            <div className="genesis-card genesis-card-interactive p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10B981]/15 to-[#10B981]/5 border border-[#10B981]/20 text-[#065F46]">
                    <Sliders className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 font-mono text-[11px] text-[#6E6E73]">
                    Step 02 · Pure Math
                  </span>
                </div>
                <h3 className="font-display text-[18px] font-bold text-[#1D1D1F]">
                  2. Explainable Rule Engine v1.0.0
                </h3>
                <p className="text-[14px] text-[#6E6E73] leading-relaxed">
                  Every assessment stores an immutable snapshot with stable reason codes, integer-cents cost breakdown, and a non-destructive &ldquo;What-If?&rdquo; parts simulator. Missing critical inputs return <code className="font-mono text-[#1D1D1F]">INSUFFICIENT_DATA</code> rather than guessing zero.
                </p>
              </div>
              <div className="rounded-xl bg-[#FAFAFC] border border-[#E5E5EA] px-3.5 py-2.5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#6E6E73]">Margin Formula</span>
                <span className="text-[#065F46] font-semibold">Value − (Parts+Labor+OH)</span>
              </div>
            </div>

            <div className="genesis-card genesis-card-interactive p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B]/15 to-[#F59E0B]/5 border border-[#F59E0B]/25 text-[#B45309]">
                    <HardDrive className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-[#F2F2F7] px-2.5 py-1 font-mono text-[11px] text-[#6E6E73]">
                    Step 03 · Audit Trail
                  </span>
                </div>
                <h3 className="font-display text-[18px] font-bold text-[#1D1D1F]">
                  3. Human Manager Approval & Sanitization Gate
                </h3>
                <p className="text-[14px] text-[#6E6E73] leading-relaxed">
                  Managers review recommendations and append workflow events. Storage-bearing devices cannot be marked <code className="font-mono text-[#1D1D1F]">ready</code> or <code className="font-mono text-[#1D1D1F]">closed</code> until external data sanitization is verified and logged.
                </p>
              </div>
              <div className="rounded-xl bg-[#FAFAFC] border border-[#E5E5EA] px-3.5 py-2.5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#6E6E73]">Gate 2: Storage Media</span>
                <span className="text-[#4F46E5] font-semibold">Verified Wipe Required</span>
              </div>
            </div>
          </div>
        </section>

        {/* Scenario Lab & Integrity Guardrails Callout */}
        <section
          id="scenario-guardrails"
          className="border-t border-[#E5E5EA] bg-[#FFFFFF] py-12 px-6"
        >
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="genesis-card p-6 space-y-3">
              <div className="flex items-center gap-2.5 font-display font-bold text-[16px] text-[#1D1D1F]">
                <div className="h-8 w-8 rounded-xl bg-[#6366F1]/12 flex items-center justify-center text-[#4F46E5]">
                  <Calculator className="h-4 w-4" aria-hidden="true" />
                </div>
                Transparent Scenario Lab (No Invented Impact Claims)
              </div>
              <p className="text-[14px] text-[#6E6E73] leading-relaxed">
                Every dollar of modelled capacity in the Scenario Lab is traceable to an editable input (monthly device volume, baseline vs. target assessment minutes, hourly labor rate, and implementation/software costs). No unverified carbon or market-scraping claims are made.
              </p>
            </div>

            <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#F59E0B]/8 p-6 space-y-3">
              <div className="flex items-center gap-2.5 font-display font-bold text-[16px] text-[#1D1D1F]">
                <div className="h-8 w-8 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center text-[#B45309]">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                </div>
                Scope & Operational Honesty Disclosure
              </div>
              <p className="text-[14px] text-[#6E6E73] leading-relaxed">
                ReuseFlow is a hackathon MVP for a proposed refurbishment triage workflow. It does <strong className="text-[#1D1D1F]">not</strong> perform certified data wiping or automated device disposal, and sample data in <code className="font-mono text-[#1D1D1F]">/demo</code> are 100% synthetic.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5E5EA] bg-[#FFFFFF] text-[#6E6E73] py-6 px-6 text-[12px]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            ReuseFlow · FUSE Society Blueprint 2026 Hackathon MVP · Decision-Support Prototype
          </span>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-[#6366F1] hover:underline">
              Interactive Demo (/demo)
            </Link>
            <Link href="/app" className="text-[#6366F1] hover:underline">
              Staff App (/app)
            </Link>
            <Link href="/login" className="text-[#6366F1] hover:underline">
              Sign In (/login)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
