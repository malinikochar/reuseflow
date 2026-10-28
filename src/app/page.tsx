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
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      {/* Top Disclosure Ribbon */}
      <div className="bg-[#FFFFFF] border-b border-[#E8E8EC] text-[#6B6B6B] px-6 py-2 text-[12px]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#20970B]" />
            <span className="font-medium text-[#0A0A0A]">
              FUSE Society Blueprint 2026 Prototype
            </span>{' '}
            — Proposed internal refurbishment decision-support workflow.
          </span>
          <span className="text-[#9C9C9C]">
            Styled with{' '}
            <span className="font-mono font-medium text-[#20970B]">DESIGN.md</span>{' '}
            (chef/genesis) · All sample metrics are fictional
          </span>
        </div>
      </div>

      {/* Genesis Sticky Top Navigation (56px height, backdrop-blur, 1px border #E8E8EC) */}
      <header className="sticky top-0 z-20 border-b border-[#E8E8EC] bg-[#FFFFFF]/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-6 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#0A0A0A] text-[#FAFAFA]">
              <Cpu className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[18px] tracking-[-0.03em] text-[#0A0A0A]">
                ReuseFlow
              </span>
              <span className="hidden sm:inline-block rounded-[4px] bg-[#FAFAFA] border border-[#E8E8EC] px-2 py-0.5 font-mono text-[11px] text-[#6B6B6B]">
                v1.0.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="genesis-btn-secondary inline-flex items-center px-3.5 py-2 text-[13px]"
            >
              Staff Sign In (/app)
            </Link>
            <Link
              href="/demo"
              className="genesis-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-[13px]"
            >
              Try Interactive Demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Genesis Interactive Dot Grid */}
      <main className="flex-1">
        <section className="genesis-dot-grid border-b border-[#E8E8EC] py-12 sm:py-16 px-6">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] border border-[#E8E8EC] px-3.5 py-1 text-[12px] font-medium text-[#0A0A0A]">
                <FlaskConical className="h-3.5 w-3.5 text-[#6366F1]" aria-hidden="true" />
                Zero-Login Public Judge Sandbox Ready
              </div>

              <h1 className="font-display text-[36px] sm:text-[56px] font-bold tracking-[-0.035em] text-[#0A0A0A] leading-[1.08]">
                Turn donated electronics into transparent, human-approved refurbishment decisions.
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#6B6B6B] leading-relaxed max-w-2xl">
                ReuseFlow standardizes intake triage with a versioned, explainable repair-economics rule engine, pre-economic battery safety quarantine, external sanitization verification gates, and an interactive Scenario Lab.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/demo"
                  className="genesis-btn-primary inline-flex items-center gap-2 px-6 py-3 text-[15px]"
                >
                  Try Interactive Demo (/demo)
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/app"
                  className="genesis-btn-secondary bg-[#FFFFFF] inline-flex items-center gap-2 px-5 py-3 text-[15px]"
                >
                  <Lock className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
                  Authenticated Staff App (/app)
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E8E8EC] text-[12px] text-[#6B6B6B]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
                  <span>Deterministic Cents Math (No Fake AI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
                  <span>Swollen Battery Safety Quarantine</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" aria-hidden="true" />
                  <span>Human Approval & Sanitization Gates</span>
                </div>
              </div>
            </div>

            {/* Right Preview Card: Worked Case A (Genesis 12px Gallery-Frame Card) */}
            <div className="lg:col-span-5">
              <div className="genesis-card genesis-card-interactive p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#E8E8EC] pb-4">
                  <div>
                    <span className="font-mono text-[12px] text-[#6B6B6B]">
                      FG-DEMO-101 · Case A Fixture
                    </span>
                    <h2 className="font-display text-[18px] font-bold text-[#0A0A0A] mt-0.5">
                      Lenovo ThinkPad T480 (8GB / 256GB)
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#10B981]/12 px-3 py-1 text-[12px] font-medium text-[#065F46]">
                    Refurbish Candidate
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-[12px]">
                  <div className="genesis-panel bg-[#FAFAFA] p-3">
                    <span className="text-[#6B6B6B]">Parts + 45m Labor</span>
                    <p className="mt-1 font-mono text-[15px] font-medium text-[#0A0A0A]">
                      $35.00
                    </p>
                  </div>
                  <div className="genesis-panel bg-[#FAFAFA] p-3">
                    <span className="text-[#6B6B6B]">Comparable Value</span>
                    <p className="mt-1 font-mono text-[15px] font-medium text-[#0A0A0A]">
                      $180.00
                    </p>
                  </div>
                  <div className="rounded-[8px] bg-[#10B981]/10 border border-[#10B981]/30 p-3">
                    <span className="text-[#065F46]">Est. Net Margin</span>
                    <p className="mt-1 font-mono text-[15px] font-medium text-[#065F46]">
                      +$145.00
                    </p>
                  </div>
                </div>

                <div className="genesis-panel bg-[#FAFAFA] p-3.5 space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#0A0A0A]">
                      Triggered Rule:{' '}
                      <code className="font-mono text-[#0A0A0A]">
                        VIABLE_COST_AND_FUNCTION
                      </code>
                    </span>
                    <span className="text-[#9C9C9C] font-mono">v1.0.0</span>
                  </div>
                  <p className="text-[#6B6B6B] leading-relaxed">
                    Device boots, is repairable, meets 8 GB laptop RAM heuristic, and clears the $20.00 minimum margin assumption. Requires human manager approval.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[13px] text-[#6B6B6B]">
                  <span>Ready to test all 6 PRD edge cases live?</span>
                  <Link
                    href="/demo"
                    className="font-medium text-[#6366F1] hover:text-[#4F46E5] underline"
                  >
                    Open /demo sandbox →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow Section */}
        <section className="py-12 sm:py-16 px-6 max-w-[1280px] mx-auto space-y-8">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#9C9C9C]">
              Workflow Architecture
            </p>
            <h2 className="font-display text-[32px] font-bold tracking-[-0.03em] text-[#0A0A0A]">
              How ReuseFlow Supports Refurbishment Operations in 3 Steps
            </h2>
            <p className="text-[15px] text-[#6B6B6B]">
              The system never replaces technicians or automates physical disposal; it standardizes triage criteria and records an auditable trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="genesis-card genesis-card-interactive p-6 space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[#0A0A0A]">
                <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-[18px] font-bold text-[#0A0A0A]">
                1. 90-Second Validated Intake & Safety Check
              </h3>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                Technicians record device category, RAM/storage, boot state, battery safety, and parts/labor estimates. Swollen batteries trigger immediate <code className="font-mono text-[#0A0A0A]">QUARANTINE</code> before any economic calculation.
              </p>
            </div>

            <div className="genesis-card genesis-card-interactive p-6 space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[#0A0A0A]">
                <Sliders className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-[18px] font-bold text-[#0A0A0A]">
                2. Explainable Rule Engine v1.0.0
              </h3>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                Every assessment stores an immutable snapshot with stable reason codes, integer-cents cost breakdown, and a non-destructive &ldquo;What-If?&rdquo; parts simulator. Missing critical inputs return <code className="font-mono text-[#0A0A0A]">INSUFFICIENT_DATA</code> rather than guessing zero.
              </p>
            </div>

            <div className="genesis-card genesis-card-interactive p-6 space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FAFAFA] border border-[#E8E8EC] text-[#0A0A0A]">
                <HardDrive className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-[18px] font-bold text-[#0A0A0A]">
                3. Human Manager Approval & Sanitization Gate
              </h3>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                Managers review recommendations and append workflow events. Storage-bearing devices cannot be marked <code className="font-mono text-[#0A0A0A]">ready</code> or <code className="font-mono text-[#0A0A0A]">closed</code> until external data sanitization is verified and logged.
              </p>
            </div>
          </div>
        </section>

        {/* Scenario Lab & Integrity Guardrails Callout */}
        <section className="border-t border-[#E8E8EC] bg-[#FFFFFF] py-12 px-6">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="genesis-panel bg-[#FAFAFA] p-6 space-y-3">
              <div className="flex items-center gap-2 font-display font-bold text-[16px] text-[#0A0A0A]">
                <Calculator className="h-4 w-4 text-[#6B6B6B]" aria-hidden="true" />
                Transparent Scenario Lab (No Invented Impact Claims)
              </div>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                Every dollar of modelled capacity in the Scenario Lab is traceable to an editable input (monthly device volume, baseline vs. target assessment minutes, hourly labor rate, and implementation/software costs). No unverified carbon or market-scraping claims are made.
              </p>
            </div>

            <div className="rounded-[8px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-6 space-y-3">
              <div className="flex items-center gap-2 font-display font-bold text-[16px] text-[#0A0A0A]">
                <ShieldAlert className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
                Scope & Operational Honesty Disclosure
              </div>
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
                ReuseFlow is a hackathon MVP for a proposed refurbishment triage workflow. It does <strong className="text-[#0A0A0A]">not</strong> perform certified data wiping or automated device disposal, and sample data in <code className="font-mono text-[#0A0A0A]">/demo</code> are 100% synthetic.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E8E8EC] bg-[#FFFFFF] text-[#6B6B6B] py-6 px-6 text-[12px]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            ReuseFlow · FUSE Society Blueprint 2026 Hackathon MVP · Design System:{' '}
            <span className="font-mono font-medium text-[#20970B]">DESIGN.md</span> (Genesis)
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
