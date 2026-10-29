# ReuseFlow — Smart Refurbishment Decision Engine

**FUSE Society Blueprint 2026 Hackathon MVP**  
*Turn donated electronics into transparent, human-approved refurbishment decisions and measurable operational outcomes.*

- **Live Production URL:** [https://reuseflow.vercel.app](https://reuseflow.vercel.app)
- **Public Judge Sandbox (Zero Login):** [https://reuseflow.vercel.app/demo](https://reuseflow.vercel.app/demo)
- **Staff & One-Click Hackathon Demo Login (`/app`):** [https://reuseflow.vercel.app/login](https://reuseflow.vercel.app/login)
- **GitHub Repository:** [https://github.com/malinikochar/reuseflow](https://github.com/malinikochar/reuseflow)
- **Author:** Malini Kochar (`malinikochar@gmail.com`)
- **Open Source License:** [GNU General Public License v3.0 (`GPL-3.0`)](LICENSE)

> **Important Scope & Honesty Disclosure:** ReuseFlow is a working hackathon prototype for a *proposed* internal electronics refurbishment triage workflow. It is **not** an official or endorsed operational system of Free Geek, does **not** perform certified data wiping or automated device disposal, and all sample data in `/demo` are 100% synthetic with zero personal donor/recipient information or real serial numbers. Case-specific alignment in [`docs/CASE_ALIGNMENT.md`](docs/CASE_ALIGNMENT.md) must be validated by an eligible participant against the restricted competitor packet before final presentation recording.

---

## 1. Product Overview

Electronics reuse organizations must quickly decide whether a donated laptop, desktop, or tablet is safe to handle, economically viable to refurbish, or requires diagnostic/recycle review—while maintaining strict human oversight over physical safety and external data sanitization.

**ReuseFlow** provides:
1. **90-Second Standardized Device Intake:** Captures hardware category, specs, boot status, cosmetic condition, battery safety, storage media presence, parts/labor assumptions, and manual comparable value estimates.
2. **Versioned, Explainable Deterministic Engine (`v1.0.0`):** Pure integer-cents cost/margin rules returning explicit recommendation codes (`REFURBISH_CANDIDATE`, `REVIEW_REQUIRED`, `RECYCLE_REVIEW`, `QUARANTINE`, `INSUFFICIENT_DATA`), cost breakdowns, and a non-destructive **"What-If?"** parts cost simulator.
3. **AI & Live Web Bench Research Copilot (`Tavily + Nebius TokenFactory`):** Optional human-in-the-loop bench research assistant (`/api/research/device-intel`) that fetches live cited secondary-market comparable pricing references and repairability guides via **Tavily Search API** and synthesizes technician guidance via **Nebius TokenFactory LLM** (`Qwen/Qwen3-30B-A3B-Instruct-2507`). Human confirmation is required before applying any suggested comparable value to the deterministic `v1.0.0` engine.
4. **Pre-Economic Safety & External Sanitization Gates:**
   - **Swollen Battery Hazard:** Immediately triggers `QUARANTINE` *before* any economic scoring and locks refurbishment approval.
   - **Data Sanitization Gate:** Separate from economic viability; storage-bearing devices cannot transition to `ready` or `closed` until a manager records verification of an externally completed sanitization procedure (this log is an internal assertion, never a wipe certificate).
5. **Role-Guarded Human Approval & Append-Only Audit Trail:** Every recommendation requires human review (`requiresHumanApproval: true`). Status transitions check current state preconditions and append immutable `workflow_events`.
6. **Interactive Scenario Lab:** Lets judges and operations leads test hypothetical monthly time/labor capacity scenarios with editable assumptions and explicit disclaimers.
7. **Zero-Login Public Sandbox (`/demo`) + Authenticated Production App (`/app`):**
   - `/demo` runs entirely in browser-local synthetic state, seeded with the 6 canonical PRD fixture cases (`Case A` through `Case F`), a role simulator (`Manager`, `Technician`, `Viewer`), and 1-click sandbox reset. It never writes to Supabase or sends Resend emails.
   - `/app` enforces cookie-based `@supabase/ssr` authentication, Postgres Row-Level Security (`supabase/migrations/20261028000001_initial_schema_and_rls.sql`), transactional status transition RPCs, and optional manager-only Resend operational summary emails (`/api/reports/send-summary`).

---

## 2. Architecture & Tech Stack

- **Framework:** Next.js 15 App Router, React 19, TypeScript (`strict: true`)
- **Styling & UI:** Tailwind CSS v4, Lucide icons, accessible operations SaaS components shared across `/demo` and `/app`
- **Validation & Domain Logic:** Zod schemas (`src/lib/validation/schemas.ts`), pure deterministic engine (`src/lib/decision/engine.ts`), Scenario Lab calculator (`src/lib/decision/scenario.ts`)
- **AI & Live Web Research Copilot (Advisory):** Server-only **Tavily Search API** + **Nebius TokenFactory LLM** (`src/lib/research/device-research-service.ts`, `/api/research/device-intel`) with deterministic spec-tier fallback when offline
- **Database & Auth (`/app`):** Supabase Postgres, `@supabase/ssr` cookie auth, Row-Level Security (RLS) policies, append-only triggers on `assessments` and `workflow_events`
- **Notifications (Optional P1):** Server-only Resend SDK (`src/lib/email/resend-service.ts`) with manager authorization, `REPORT_RECIPIENT_ALLOWLIST`, idempotency keys, and rate limiting
- **Testing:** Vitest unit & integration suites (`tests/unit/`, `tests/integration/`) + Playwright E2E browser smoke suite (`tests/e2e/`)

---

## 3. Worked PRD Fixtures Included in `/demo`

| Case | Asset Tag | Scenario | Engine Output (`v1.0.0`) |
|---|---|---|---|
| **Case A** | `FG-DEMO-101` | Viable 8 GB laptop; boots; repairable; $20 parts + 45m labor ($15) vs $180 value | `REFURBISH_CANDIDATE` ($35 cost, +$145 margin) |
| **Case B** | `FG-DEMO-102` | Borderline 4 GB laptop; $40 parts + 90m labor ($30) vs $70 value | `REVIEW_REQUIRED` (`LOW_RAM`, `BELOW_MARGIN_THRESHOLD`) |
| **Case C** | `FG-DEMO-103` | High-spec laptop with **swollen battery** | `QUARANTINE` (`SAFETY_BATTERY_SWOLLEN` overrides economics) |
| **Case D** | `FG-DEMO-104` | No boot; not repairable; $200 parts + 60m labor ($20) vs $80 value | `RECYCLE_REVIEW` (-$140 margin; requires human review) |
| **Case E** | `FG-DEMO-105` | Tablet missing manual comparable value estimate | `INSUFFICIENT_DATA` (lists `comparableValueCents`) |
| **Case F** | `FG-DEMO-106` | Viable desktop (+$115 margin) with `storagePresent=true` and pending wipe | `REFURBISH_CANDIDATE`, but `sanitizationGateOpen = false` blocks `ready`/`closed` |

---

## 4. Local Setup & Verification Commands

### Prerequisites
- Node.js 20+ and npm

### Install & Run
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open `http://localhost:3000` (landing page) or `http://localhost:3000/demo` (zero-credential interactive sandbox).

### Quality Gate Commands
```bash
npm run typecheck   # TypeScript strict mode check (tsc --noEmit)
npm run lint        # ESLint Next.js & TypeScript rules
npm run test        # Vitest unit & security integration suites (32 tests)
npm run build       # Production Next.js build verification
npm run test:e2e    # Playwright end-to-end browser verification (3 suites)
```

---

## 5. Supabase, Resend, Tavily & Nebius Configuration

1. Create a Supabase project and apply `supabase/migrations/20261028000001_initial_schema_and_rls.sql` in the SQL Editor (and optionally run `supabase/tests/rls_verification.sql` to verify RLS and `anon` privilege revocation).
2. Populate `.env.local` (or Vercel Environment Variables):
   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_DEMO_ENABLED=true

   # Optional P1 Resend Server-Only Configuration
   RESEND_API_KEY=re_your_server_key
   RESEND_FROM_EMAIL="ReuseFlow <updates@your-verified-domain.org>"
   REPORT_RECIPIENT_ALLOWLIST="manager@your-verified-domain.org"

   # Optional AI & Web Bench Research Copilot (Server-Only)
   TAVILY_API_KEY=tvly_your_server_key
   NEBIUS_API_KEY=your_nebius_tokenfactory_key
   NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1
   NEBIUS_MODEL=Qwen/Qwen3-30B-A3B-Instruct-2507
   ```
3. Never expose `RESEND_API_KEY`, `TAVILY_API_KEY`, `NEBIUS_API_KEY`, or Supabase secret/service-role keys under `NEXT_PUBLIC_`.

---

## 6. FUSE Society Blueprint 2026 Submission Checklist

- [ ] Validate [`docs/CASE_ALIGNMENT.md`](docs/CASE_ALIGNMENT.md) against the official competitor case packet using permitted short paraphrases only (never upload the restricted case packet).
- [ ] Verify public Vercel `/demo` URL in an incognito browser on desktop and mobile.
- [ ] Record <= 8:00 presentation following [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) and upload to YouTube as **Unlisted** (not Private).
- [ ] Publish the Devpost project page before **October 31, 2026, 12:00 AM EDT (9:30 AM IST)**.
- [ ] Complete and submit the separate **official competition submission form**, including honest AI disclosure from [`docs/AI_DISCLOSURE.md`](docs/AI_DISCLOSURE.md).

---

## 7. Open Source License

This project is licensed under the **GNU General Public License v3.0 (`GPL-3.0`)** in compliance with open-source hackathon requirements. See the [`LICENSE`](LICENSE) file for full license text.
