# ReuseFlow — Smart Refurbishment Decision Engine

**Product Requirements Document (PRD) · Version 1.0 · October 28, 2026**  
**Hackathon:** FUSE Society Blueprint 2026  
**Target build environment:** Google Antigravity 2.0, Gemini 4 Argon (user-selected)  
**Stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres/Auth/RLS), Resend, GitHub, Vercel  
**Delivery classification:** Hackathon MVP, not production-certified refurbishment or data destruction software  
**Status:** Approved concept; case-specific relevance still needs validation against the official competitor case packet.

---

## 0. Read this first — ground truth and constraints

This document specifies a working **prototype for internal electronics refurbishment triage**. It is *not* evidence that Free Geek has confirmed the described problems, workflows, costs, or priorities. The published hackathon overview identifies Free Geek as the partner, but the actual case packet and detailed rubric could not be fully read through the available browser. Before claiming case alignment, a registered participant must consult the case packet themselves and write a case-specific problem statement in `docs/CASE_ALIGNMENT.md`. Do **not** copy, publish, or distribute the restricted case packet.

Competition facts verified on the public Devpost site:

- The solution must address the business challenge in the **specific case**, not just an interesting generic idea.
- Core judging emphasizes analysis and fit; a functioning build can earn an additional technical execution bonus of up to **10 points**.
- Submission requires a **published Devpost project**, **unlisted YouTube recording of at most 8 minutes**, and **official submission form**, including AI-use disclosure.
- Deadline: **October 31, 2026, 12:00 AM EDT**, equivalent to **October 31, 2026, 9:30 AM IST**. Aim to finish October 30 IST.
- Project work must comply with participant eligibility, originality, AI disclosure and outside-assistance rules. Only eligible team members do substantive competition work.

> **Go/no-go gate:** If the case is about an unrelated business issue, alter the feature priorities and story before coding further. A polished tool that does not solve the case may not score well.

**Claim discipline:** Every numeric business claim in the pitch is either (a) case-verified with a cited source, (b) computed from clearly labeled user-provided inputs, or (c) a clearly labeled hypothetical estimate. Never imply sample data are actual Free Geek operations or that ReuseFlow performs certified data wiping.

---

## 1. Executive summary

**Product name:** ReuseFlow  
**One-liner:** *Turn donated electronics into transparent, human-approved refurbishment decisions and measurable operational outcomes.*  
**Concept:** An internal web application for recording donated devices, evaluating repair economics with versioned and explainable rules, routing devices through a review workflow, and showing a transparent impact dashboard.

**The problem hypothesis:** Manual, inconsistent device triage can make it difficult for a reuse organization to prioritize repair effort, document decisions, estimate costs, and identify potentially reusable devices. This is a hypothesis to validate against the official case, not an assertion of a partner's actual practices.

**Proposed value:** Standardized intake, explicit recommendation reasons, cost visibility, and an auditable decision trail. Staff remain accountable for device safety, data handling, and final disposition.

**What makes it a strong hackathon demo:** Judges can enter one laptop, watch an explainable assessment run instantly, approve the next action, and see a financial scenario update—all with real working code and a concise business rationale.

### 1.1 Product principles

1. **Decision support, not autonomous disposal.** A recommendation never triggers a physical device action or certifies safety.
2. **Explainability over fake AI.** Start with auditable business rules and rationale codes; do not present a rules engine as machine learning.
3. **Safe-by-default handling.** Safety hazards trigger quarantine; data-bearing devices cannot be marked ready/disposed until sanitization has been human-verified or an authorized destruction path is documented.
4. **Evidence over hype.** Financial assumptions remain editable and labeled.
5. **Demo-first reliability.** A zero-login public sandbox must work even when Supabase/Resend are unavailable.
6. **Scope discipline.** Build a small vertical slice end-to-end before optional polish.

### 1.2 Goals / measurable definition of done

| Goal | Hackathon acceptance target | How to demonstrate |
|---|---|---|
| Intake | Add a device with validated fields in under 90 seconds | Live create-device demo |
| Explainable analysis | Every non-error decision shows a category, reason codes, costs, and rule version | Decision card with breakdown |
| Workflow | Authorized user approves a next state and produces an immutable event | Timeline before/after |
| Operational visibility | Dashboard totals match fixture data and filters | Demo dashboard |
| Business case | Scenario calculator separates baseline assumptions from measured results | Change labor/volume inputs |
| Public access | `/demo` needs no credentials, works on mobile, and never modifies real customer data | Incognito demo |
| Real application | Signed-in users can persist/read records through RLS-protected Supabase | Verified test account |
| Delivery | Vercel URL, GitHub repository, published Devpost, unlisted <=8 min recording, submission form | Link checklist |

---

## 2. Target users and jobs-to-be-done

| Persona | Need | Relevant permissions |
|---|---|---|
| Intake volunteer / technician | Record condition/specs; see clear next step; avoid unsafe devices | Create records, request assessment, update permitted draft fields |
| Refurbishment manager | Review recommendations and make final decisions | Approve/reject recommendations, mark safety/data disposition, view metrics |
| Operations lead / analyst | Understand device throughput, estimated costs, bottlenecks, and hypothetical savings | Read all, export aggregate demo metrics |
| Hackathon judge (public demo) | Understand the opportunity and test the complete product quickly | Isolated synthetic-data sandbox; no authentication required |

**Single-organization MVP.** Do not implement multi-tenancy, donor/recipient accounts, volunteer scheduling, or real beneficiary matching in this version.

---

## 3. Scope and prioritization

### P0 — must be functioning before presentation recording

1. Polished responsive landing page, clear problem/solution and **Try Interactive Demo** CTA.
2. Public `/demo` with seeded fictional devices; create/edit/evaluate/approve actions modify only sandbox state (in browser), not real Supabase.
3. Device intake: category, model/specs, state, battery/safety, storage/data considerations, parts/labor assumptions, and estimated comparable value.
4. Versioned deterministic recommendation engine with **reason codes** and cost/margin breakdown.
5. Device inventory with search, status/category filters, detail and assessment timeline.
6. Human review action; state transition audit events; quarantine and sanitization gates.
7. Dashboard: intake count, category mix, recommendations, cost assumptions, workflow distribution, and **Scenario Lab** for hypothetical time/labor savings.
8. Supabase migrations and RLS; authenticated `/app` for real persistence; seed/dev fixtures with no actual PII.
9. Tests for engine edge cases, form validation, protected routes, RLS policy intent, smoke flows, responsive experience.
10. GitHub-ready README, `.env.example`, Vercel deployment and documentation of limitations.

### P1 — only after P0 is stable

- **Resend:** an authorized manager can send a manually triggered summary to an approved address. In demo mode show an email preview only (no actual send).
- CSV export of filtered inventory, clearly marked sample when in demo.
- Editable economic thresholds in manager settings, including visible audit for changes.
- Browser-generated printable assessment sheet (no personal identifiers).

### P2 — deliberately out of scope

- Predictive AI/LLM classification, computer-vision grading, hardware diagnostics.
- Real device wiping, wipe certification or secure-data-deletion operations.
- Real-time pickup routing, payment integration, marketplaces, donation pledges.
- Automated recycling/disposal approval, compliance certification, barcode hardware integration.
- Multi-organization billing, external recipient PII, complex RBAC admin console.

**Cut rule:** If deadline risk emerges, keep the public demo, intake → explainable decision → human approval → scenario dashboard; remove P1 before weakening the P0 end-to-end path.

---

## 4. User journeys and acceptance criteria

### Journey A — 90-second judge walkthrough

1. Judge opens `/`, sees a strong tagline, two-sentence explanation, and CTA.
2. `/demo` shows a dashboard with an explicit **Fictional Sample Data** badge.
3. Judge clicks **New device**, selects *Laptop*, enters condition, specs, labor, parts, comparable used value.
4. Judge clicks **Assess device**; sees `REFURBISH_CANDIDATE`, `REVIEW_REQUIRED`, `RECYCLE_REVIEW`, `QUARANTINE`, or `INSUFFICIENT_DATA` with rationale.
5. Judge expands **Why this result?**, showing triggered rules, cost arithmetic, and information gaps.
6. Judge chooses **Approve for refurbishment** (sandbox simulation); event appears in timeline.
7. Judge opens **Scenario Lab** and changes monthly device volume and minutes saved; totals recalculate immediately.

**Accept:** Every click works; no broken links; metrics reflect the updated sandbox state; empty/invalid submissions have accessible inline errors; no real-world operational action is implied.

### Journey B — technician with real account

- Sign in; view authorized app; create a device; edit only permitted fields while in intake; request analysis; view previous immutable assessments; propose an outcome.
- If device has a safety hazard, triage returns `QUARANTINE` before economic checks.
- If the device may contain data, system highlights *Sanitization not yet verified*. It may be recommended for repair but may not be marked ready/disposed.

**Accept:** A technician cannot self-assign manager rights or perform manager-only final approval. Failed writes show errors and do not update UI optimistically as if successful.

### Journey C — manager approval

- Manager reviews reason codes and cost breakdown; chooses **Approve**, **Request details**, or **Escalate** with an optional note.
- Manager can record an externally completed sanitization verification (who, when, method/reference; no claim ReuseFlow performed it).
- A status change creates an append-only workflow event (`from`, `to`, `actor`, `time`, `note`).

**Accept:** Invalid status transitions fail server-side; unverified data-bearing assets cannot be marked ready or closed as distributed/recycled, except through a separately documented authorized destruction/escalation path designed with appropriate procedures. For MVP, simply block closure and require review.

---

## 5. Functional specification: screens and components

| Route | Audience | Purpose | Must-have states |
|---|---|---|---|
| `/` | Public | Product story, 3-step process, benefits, CTA, disclosure | Mobile and desktop |
| `/demo` | Public | Entire interactive isolated demo shell | Seed/reset, no DB writes, fictional badge |
| `/login` | Staff | Supabase Auth login | Loading, invalid login, recovery copy |
| `/app` | Authenticated | Dashboard & Scenario Lab | Empty, loading, error, populated |
| `/app/devices` | Authenticated | Inventory/search/filter | Empty list, pagination if needed |
| `/app/devices/new` | Authorized staff | Intake wizard/form | Validation and submission error |
| `/app/devices/[id]` | Authenticated | Details, assessment, status, history | Missing item, stale status, unauthorized |
| `/app/settings` | Manager | Assumptions, optional P1 settings | Restricted access |

**Avoid implementing separate duplicate screens for `/demo` and `/app`:** share presentation components, assessment functions, and types. Use a `DeviceRepository` interface with an in-memory demo adapter and Supabase production adapter. Public sandbox data should live in React state or browser-local storage and be resettable; it must never write to the production database.

### 5.1 Design direction

- Visual: credible operations SaaS, not generic AI-chat UI. Off-white/charcoal backgrounds, restrained teal or forest accent, one amber safety color, clean cards, subtle borders, high-contrast typography.
- Desktop shell: narrow left navigation, page header, compact metric cards, device table, drawer/detail panels.
- Mobile: condensed navigation and stacked cards; no horizontal overflow on 375px screens.
- Accessibility: keyboard focus, visible labels, helpful errors, 44px touch targets where feasible, AA contrast, semantic status text (not color alone).
- Microcopy: **Recommended action**, **Needs human approval**, **Hypothetical savings**; never **AI certified** or **data wiped automatically**.
- A live narrative demo should not require more than 5–7 clicks to show full value.

### 5.2 Essential reusable components

`AppShell`, `MetricCard`, `DeviceTable`, `DeviceFilters`, `DeviceIntakeForm`, `AssessmentPanel`, `DecisionReasons`, `CostBreakdown`, `SafetyBanner`, `SanitizationBadge`, `WorkflowTimeline`, `StatusTransitionDialog`, `ScenarioLab`, `DemoModeBanner`, `EmptyState`, `ErrorState`, `LoadingSkeleton`.

---

## 6. Decision engine — the product's centerpiece

### 6.1 Input contract (TypeScript domain model)

```ts
type DeviceCategory = 'laptop' | 'desktop' | 'tablet';
type Condition = 'good' | 'fair' | 'poor' | 'unknown';
type BatterySafety = 'normal' | 'degraded' | 'swollen' | 'unknown' | 'not_applicable';
type Sanitization = 'pending' | 'verified' | 'not_applicable';

type AssessmentInput = {
  category: DeviceCategory;
  brand?: string; model?: string;
  ramGb?: number | null;
  storageGb?: number | null;
  boots?: boolean | null;
  condition: Condition;
  batterySafety: BatterySafety;
  storagePresent: boolean;
  repairable?: boolean | null;
  chargerIncluded?: boolean | null;
  partsCostCents?: number | null;
  estimatedLaborMinutes?: number | null;
  comparableValueCents?: number | null; // manual estimate, NOT scraped market truth
};

type Decision =
  | 'QUARANTINE'
  | 'INSUFFICIENT_DATA'
  | 'REFURBISH_CANDIDATE'
  | 'RECYCLE_REVIEW'
  | 'REVIEW_REQUIRED';

type AssessmentResult = {
  decision: Decision;
  ruleVersion: '1.0.0';
  reasonCodes: string[];
  reasonDetails: string[];
  repairCostCents: number | null;
  marginCents: number | null;
  sanitizationGateOpen: boolean; // false if storage present and not verified
  requiresHumanApproval: true;
};
```

`Sanitization` is tracked on the **device record**, not an input to economic viability. The engine may identify a viable refurbish candidate while the separate **ready/disposition gate** remains closed.

### 6.2 Configurable **illustrative demo rules**, v1.0.0

These thresholds are initial **product assumptions** pending case verification, not a certified standard, legal requirement, or externally validated recommendation:

| Setting | Seed default | Purpose |
|---|---:|---|
| Labor rate | $20/hour | Repair-cost scenario calculation |
| Minimum positive margin | $20 | Example threshold for high-priority repair |
| Minimum laptop RAM | 8 GB | Triage heuristic only, with review fallback |
| Additional processing cost | $0 | Explicit configurable overhead assumption |
| Baseline minutes per assessment | 12 | **Hypothetical** baseline for Scenario Lab |
| Target minutes per assessment | 6 | **Hypothetical** target for Scenario Lab |

**Priority-ordered algorithm:**

```text
1. Validate enums, ranges and impossible combinations.
2. IF batterySafety == swollen:
     QUARANTINE; reason = SAFETY_BATTERY_SWOLLEN; stop.
3. IF critical required inputs absent (boots, repairable,
   partsCost, estimatedLaborMinutes, comparableValue):
     INSUFFICIENT_DATA; list missing fields; stop.
4. IF unsupported category OR condition unknown with ambiguous safety:
     REVIEW_REQUIRED; reason = UNVERIFIED_CONDITION; stop.
5. Compute laborCost = round(laborMinutes * laborRateCents / 60).
   totalRepairCost = partsCost + laborCost + overheadCents.
   margin = comparableValue - totalRepairCost.
6. IF repairable == false AND margin < 0:
     RECYCLE_REVIEW; reason = NOT_REPAIRABLE_AND_NEGATIVE_MARGIN.
   ELSE IF boots == true AND repairable == true AND
      margin >= minimumMargin AND
      (category != laptop OR ramGb >= minimumLaptopRam):
     REFURBISH_CANDIDATE; reason = VIABLE_COST_AND_FUNCTION.
   ELSE:
     REVIEW_REQUIRED; attach explicit reasons, e.g.
     BELOW_MARGIN_THRESHOLD, LOW_RAM, BOOT_FAILURE,
     REPAIRABILITY_UNCERTAIN.
7. Always return requiresHumanApproval=true.
8. Mark sanitizationGateOpen=false for storage-bearing devices
   without human-verified wipe. Never equate assessment with wipe.
```

**Notes:** `ramGb` missing for laptop produces review rather than treating unknown as zero. Use integer cents for money; use null for unknowable estimates; never divide by zero to invent a return percentage. A `RECYCLE_REVIEW` is **not** an instruction to discard a device. Hazardous devices must be handled according to the organization's real procedures, beyond this software's scope.

### 6.3 Explainability contract

Each engine result displays:

- Recommended category + **human approval required** label.
- 2–5 concise reason texts derived from stable reason codes, not fabricated generative reasoning.
- Inputs used; any missing inputs.
- Labor, parts, overhead, total repair cost, entered comparable value, margin (all in selected example currency).
- Rule version and calculation timestamp.
- Independent **Safety** and **Sanitization** gates.
- Optional **What if?** ability to adjust repair parts cost and recompute *without overwriting the historic assessment*.

### 6.4 Worked fixture examples (fictional)

| Case | Inputs | Expected result |
|---|---|---|
| A — viable laptop | boots; repairable; 8 GB; parts $20, labor 45 min, value $180, normal battery | REFURBISH_CANDIDATE; costs $35, margin $145 |
| B — borderline | boots; repairable; 4 GB; parts $40, labor 90 min, value $70 | REVIEW_REQUIRED; low RAM and/or low margin |
| C — safety | swollen battery, any value | QUARANTINE; overrides economics |
| D — economically unviable | no boot; not repairable; parts $200, labor 60 min, value $80 | RECYCLE_REVIEW; human review only |
| E — missing data | no comparable value | INSUFFICIENT_DATA |
| F — data-bearing | viable result, storagePresent=true, wipe pending | recommendation may be viable; ready/disposition gate blocked |

---

## 7. Workflow model and guardrails

### 7.1 Separate decision from operational status

- **Recommendation** describes an economic triage conclusion. Enum: `QUARANTINE`, `INSUFFICIENT_DATA`, `REFURBISH_CANDIDATE`, `RECYCLE_REVIEW`, `REVIEW_REQUIRED`.
- **Workflow status** records what humans have actually authorized/done. Enum: `intake`, `assessed`, `approved_refurb`, `repairing`, `ready`, `recycle_review`, `quarantined`, `closed`.
- **Disposition** is optional until closure. Enum: `distributed`, `recycled`, `other_authorized` (each requires a note).

Illustrative permitted transitions:

```text
intake -> assessed | quarantined
assessed -> approved_refurb | recycle_review | quarantined | intake
approved_refurb -> repairing | assessed
repairing -> ready | assessed | quarantined
recycle_review -> assessed | closed
ready -> closed | assessed
quarantined -> assessed  (manager only after safety review)
closed -> terminal (cannot reopen through MVP UI)
```

**Guard conditions:** manager authorization for `approved_refurb`, `ready`, `quarantined` release, and `closed`; every transition has actor/time/note and is checked by server. `ready` and `closed` require verified sanitization when storagePresent=true. For non-data-bearing devices, `not_applicable` requires manager rationale. Closing a quarantined device is not supported in MVP.

### 7.2 Data handling honesty

The app **does not erase user data**. It can record a staff member's assertion that a data sanitization procedure was performed outside the app. This record is **not** a certificate of data destruction. Do not store previous owners' names, personal files, serial numbers, or recipients' identities in the public demo.

---

## 8. Data and Supabase architecture

### 8.1 Recommended deployment topology

```text
Browser (Next.js App Router + shared UI)
  |-- /demo -> in-memory/browser-local synthetic demo adapter (no privileged API access)
  |-- /app -> cookie-based Supabase Auth -> authorized server actions/routes
                                           -> Supabase Postgres/RLS
                                           -> assessment + workflow event tables
  |-- Send summary (manager only) -> server-only Resend SDK -> approved email address

GitHub main branch -> Vercel build/deployment -> domain + server env vars
```

Use `@supabase/ssr` and Supabase's up-to-date Next.js guidance. For Next.js 16+, follow the current `proxy.ts` convention rather than copying outdated `middleware.ts` examples. Do not rely on client state or `getSession().user` as authorization. Verify claims/user on the server and enforce role/RLS independently.

### 8.2 Minimum database tables

**All IDs UUID unless noted; `created_at` timestamptz; use `updated_at` where appropriate.** Put schema in version-controlled `supabase/migrations/*.sql`.

| Table | Core columns | Controls |
|---|---|---|
| `profiles` | `id` PK -> `auth.users.id`, `display_name`, `role` enum (`manager`, `technician`, `viewer`), timestamps | Never permit self-promotion. Role set by privileged admin/bootstrap path. |
| `devices` | `id`, `asset_tag` UNIQUE, `category`, `brand`, `model`, `ram_gb`, `storage_gb`, `boots`, `condition`, `battery_safety`, `storage_present`, `repairable`, `charger_included`, `parts_cost_cents`, `estimated_labor_minutes`, `comparable_value_cents`, `sanitization_status`, `sanitization_verified_by`, `sanitization_verified_at`, `sanitization_note`, `status`, `disposition`, `created_by`, timestamps | Check nonnegative cents/minutes and valid enums. No owner PII/real serials in demo. |
| `assessments` | `id`, `device_id` FK, `input_snapshot` JSONB, `decision`, `rule_version`, `reason_codes` JSONB, `cost_breakdown` JSONB, `margin_cents`, `assessed_by`, `created_at` | Append-only. Evaluate server-side for real app; snapshots reproducible. |
| `workflow_events` | `id`, `device_id` FK, `from_status`, `to_status`, `actor_id`, `note`, `created_at` | Append-only events produced by authorized transition, no deletes. |
| `assumption_settings` | single active version / key-value or typed row: `hourly_rate_cents`, `min_margin_cents`, `min_laptop_ram_gb`, `overhead_cents`, `baseline_minutes`, `target_minutes`, `version`, `updated_by`, `updated_at` | Restrict updates to manager; P0 can be read-only seeded defaults. |
| `email_events` (P1) | `id`, `type`, `recipient`, `provider_id`, `idempotency_key`, `status`, `sent_by`, `created_at` | Manager-only access; do not store content/PII unnecessarily. |

**Indexes:** `devices(status)`, `devices(category)`, `devices(created_at desc)`, `assessments(device_id, created_at desc)`, `workflow_events(device_id, created_at desc)`; add role-related indexes where policies filter. No broad public table grant by default.

**RLS policy intent:**

| Role | Device read | Device create | Intake edit | Final approval/status | Settings | Events |
|---|---|---|---|---|---|---|
| `anon` | None | None | None | None | None | None |
| `viewer` | Yes | No | No | No | Read | Read |
| `technician` | Yes | Yes | Own/authorized mutable intake fields only | No | Read | Read |
| `manager` | Yes | Yes | Yes | Yes, through validated server function | Read/write | Read |

Implement grants and RLS on **every exposed table**. RLS is necessary but not sufficient: role-sensitive transitions must be validated in a transaction/server-side RPC; do not trust `role` or `user_id` supplied in request bodies. Avoid recursive RLS by using carefully secured helper functions where necessary. Keep service-role/secret credentials exclusively server-side; prefer user-scoped clients for normal operations.

### 8.3 Data access boundaries

```ts
interface DeviceRepository {
  list(filters?: DeviceFilters): Promise<Device[]>;
  get(id: string): Promise<Device | null>;
  create(input: DeviceCreateInput): Promise<Device>;
  updateIntake(id: string, input: DeviceUpdateInput): Promise<Device>;
  saveAssessment(id: string, result: AssessmentResult): Promise<AssessmentRecord>;
  transition(id: string, next: WorkflowStatus, note: string): Promise<WorkflowEvent>;
}
```

`DemoDeviceRepository` uses synthetic data only, never Supabase; `SupabaseDeviceRepository` uses authenticated server access. The same domain engine serves both. Define shared Zod schemas in `/src/lib/validation/` and invoke again on the server, not only in the browser.

**Concurrency:** use a status precondition or optimistic version (`updated_at`/`row_version`) in transitions. If stale, return conflict and refresh; avoid silently overwriting another manager's decision.

### 8.4 Runtime environment variables

```dotenv
# Client-safe public values. Never place secrets under NEXT_PUBLIC_!
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server-side only. Omit if not needed by the chosen auth/seed design.
# SUPABASE_SECRET_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=ReuseFlow <updates@YOUR_VERIFIED_DOMAIN>
REPORT_RECIPIENT_ALLOWLIST=

# Public sandbox uses local sample fixtures, never production tables.
NEXT_PUBLIC_DEMO_ENABLED=true
```

Use the actual key names supported by the project's Supabase configuration; if using a legacy anon key, document it and keep secret/service-role keys out of the browser. Never check `.env.local` or keys into GitHub. Configure env vars in Vercel for the correct environments and redeploy after changes. Verify Resend sender domain before expecting emails to deliver.

---

## 9. API and server-action contracts

Use Server Actions or Next.js Route Handlers consistently. These are logical contracts, not mandates to expose unauthenticated REST endpoints. All real-data write operations: validate input, authenticate identity, authorize role, enforce workflow preconditions, execute transaction as appropriate, return safe error shape.

| Operation | Input | Output | Access / checks |
|---|---|---|---|
| `createDevice` | Zod `DeviceCreateInput` | Device, id | technician/manager; validated fields |
| `updateDeviceIntake` | id, version, allowed intake fields | Device | authorized, no audit overwrite |
| `assessDevice` | deviceId | Assessment record | signed-in staff; server recomputes engine; saves immutable snapshot |
| `transitionDevice` | deviceId, expectedStatus, nextStatus, note | WorkflowEvent + status | manager, allowed transition, sanitization gate, atomic write |
| `verifySanitization` | deviceId, status, note | Device | manager, audit note; no claim of actual wiping |
| `getDashboardSummary` | optional filters | aggregate metrics | authorized; no donor PII |
| `sendSummary` (P1) | scope, approved recipient | provider result + email log | manager, verified sender, recipient allowlist, rate limit, no demo sends |

**Error shape:** `{ ok: false, code: 'VALIDATION' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 'FAILED_DEPENDENCY' | 'INTERNAL', message: string }`. Display human-friendly messages and retry guidance. Never leak email provider keys, SQL exceptions, or stack traces to users.

---

## 10. Scenario Lab and business impact model

**Purpose:** Let a judge test the *potential* business case without misrepresenting data as proof.

Editable inputs (with labels): devices per month, current manual assessment minutes, potential optimized assessment minutes, loaded hourly labor rate, estimated implementation cost, monthly software operating cost. Use number inputs/sliders with appropriate limits. All outputs live-update.

```text
minutes_saved_per_device = max(0, baseline_minutes - proposed_minutes)
monthly_hours_saved = devices_per_month * minutes_saved_per_device / 60
monthly_labor_value = monthly_hours_saved * hourly_labor_rate
monthly_net_value = monthly_labor_value - monthly_software_cost
simple_payback_months = implementation_cost / monthly_net_value
  only if monthly_net_value > 0; otherwise display "No payback under these assumptions"
```

**Seed *hypothetical* scenario:** 100 devices/month, 12 min vs. 6 min assessment, $20/hour labor, $0 monthly software and implementation costs **for isolated arithmetic demonstration only**. This yields 10 hours and $200 per month in hypothetical labor-value capacity; not audited savings. The final business case must include realistic deployment/maintenance costs before making a payback claim.

Label states:

- `Illustrative scenario · not measured organizational performance`.
- `Inputs can be edited; estimates depend on assumptions`.
- `Labor value is not necessarily cash savings or incremental revenue`.

No invented sustainability/carbon metrics. If presenting devices diverted from landfill, label as a count-based scenario and avoid unverified CO₂ conversion factors.

---

## 11. Notifications / Resend (P1)

**Use case:** After a manager approves a report, send an optional summary (e.g., subject `ReuseFlow — Weekly Sample Operations Summary`). The email contains aggregate counts and a link to the app, not personal data or owner/device serial identifiers.

- Only a manager triggers sending, from an authenticated server endpoint.
- Sender must be verified with Resend; recipient must appear in a server-controlled allowlist (for MVP).
- Configure `RESEND_API_KEY` server-only. Validate recipient, apply rate limit and idempotency key, surface provider errors.
- Persist `email_events` status and provider id if P1 is implemented.
- `/demo` displays a deterministic preview without sending anything.
- If email configuration is absent, show **Email notifications not configured**; don't fail the assessment flow.

This is a compelling integration but **not required to show the central business value**. Never prioritize email over working triage.

---

## 12. Nonfunctional requirements

| Concern | MVP requirement |
|---|---|
| Performance | Normal demo interactions feel instant; no unnecessary external calls; test on mobile throttling if possible |
| Availability | Public sandbox works independently of Supabase and Resend; error boundaries on real app |
| Security | Auth verification server-side, role checks, RLS/grants, no secrets in browser, no unauthenticated writes |
| Privacy | Fictional demo data; no donor/recipient personal info; no device owner files/serial numbers |
| Accessibility | Semantic elements, keyboard support, contrast, focus, labeled forms/errors |
| Integrity | Assessment snapshots immutable; workflow changes append audit events, constrained transitions |
| Financial correctness | Integer cents, null handling, nonnegative inputs, deterministic formulas |
| Observability | Structured server logs with sensitive values omitted; graceful errors; build/test checks |
| Responsiveness | 375px mobile, tablet, 1440px desktop smoke-tested |

---

## 13. Testing plan and acceptance matrix

### 13.1 Unit tests — rule engine (Vitest recommended)

- Swollen battery -> QUARANTINE regardless of value/specs.
- Missing critical input -> INSUFFICIENT_DATA and explicit missing-field reason.
- Viable 8 GB laptop -> REFURBISH_CANDIDATE with expected $35 cost, $145 margin (fixture).
- 4 GB laptop -> REVIEW_REQUIRED if below minimum RAM.
- Not repairable and negative margin -> RECYCLE_REVIEW, human approval required.
- Negative money/minutes, impossible enums, NaN/Infinity -> validation failure.
- Zero repair cost and unknown value -> no divide-by-zero, no fabricated ratio.
- Storage-bearing with wipe pending -> economic recommendation allowed but disposition gate false.
- Date, currency and rounding edges -> deterministic results.
- Same input + config + rule version -> same result, independent of time/environment.

### 13.2 Integration/security tests

- Anonymous access to `/app` redirects to login; anonymous DB read/write denied.
- Authenticated technician can create device but cannot approve/close or update their role.
- Manager can approve eligible transitions but cannot bypass safety/wipe gate.
- RLS denies unauthorized writes to immutable assessments/events (test user/nonmember/role).
- Concurrent status change with stale expected state returns `CONFLICT`.
- Resend route missing auth/allowlist returns forbidden; no demo send to external email.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.

### 13.3 End-to-end smoke script

1. Open deployed site in private browser and click **Try Demo**.
2. Check populated sample metrics + Fictional Sample Data banner.
3. Create safe laptop fixture; assess; inspect reasons; approve; timeline updates.
4. Create swollen-battery example; observe quarantine and disabled approval.
5. Adjust Scenario Lab; verify hypothetical label and recalculation.
6. Reload/reset demo; ensure no changes entered production Supabase.
7. Check mobile layout and browser console/network errors.
8. Log into authorized `/app`; create and reload persisted device; verify role protections.
9. Confirm no secrets in browser JS, public source, or GitHub.

---

## 14. Suggested repository structure

```text
reuseflow/
├── AGENTS.md
├── ReuseFlow_PRD.md
├── README.md
├── .env.example
├── .gitignore
├── .agents/
│   └── skills/
│       ├── case-alignment/SKILL.md
│       ├── product-ux/SKILL.md
│       ├── decision-engine/SKILL.md
│       ├── supabase-security/SKILL.md
│       ├── resend-email/SKILL.md
│       ├── quality-assurance/SKILL.md
│       └── vercel-demo/SKILL.md
├── docs/
│   ├── CASE_ALIGNMENT.md
│   ├── DEMO_SCRIPT.md
│   └── AI_DISCLOSURE.md
├── supabase/
│   ├── migrations/
│   └── tests/
├── src/
│   ├── app/
│   │   ├── (marketing)/page.tsx
│   │   ├── demo/page.tsx
│   │   ├── login/page.tsx
│   │   ├── app/{page.tsx,devices/,settings/}
│   │   └── api/
│   ├── components/{layout,devices,assessments,analytics,shared}/
│   ├── features/{devices,workflow,dashboard}/
│   ├── lib/{decision,validation,auth,supabase,repositories,email}/
│   ├── fixtures/demo-devices.ts
│   └── types/
└── tests/{unit,integration,e2e}/
```

This is a conceptual structure; Antigravity can adjust conventions for the chosen Next.js version. Avoid having both the route segment `(marketing)` and a conflicting root `page.tsx`.

---

## 15. Implementation phases with exit gates

**Phase 0 — case alignment + repo (Oct 28).** Read case as an eligible participant; populate `docs/CASE_ALIGNMENT.md` with a short *paraphrased* issue statement, 2–3 case-supported facts and source references, why this product fits, an explicit rejection test, and assumptions. Initialize Next.js/TS/Tailwind/shadcn, GitHub, env template, CI baseline. **Gate:** concept does address the case.

**Phase 1 — domain vertical slice (Oct 28–29).** Implement Zod schemas, deterministic engine, six fixtures, tests, and shared intake/result component. **Gate:** tests pass and one device is assessed in demo.

**Phase 2 — public demo + visual quality (Oct 29).** Build landing, inventory, timeline, dashboard, Scenario Lab, demo reset; responsive polish. **Gate:** a guest can complete end-to-end live journey with no accounts.

**Phase 3 — secure persistence (Oct 29–30).** Supabase Auth, migrations, grants/RLS, authenticated repository, manager approval and audit. **Gate:** authorized device persists and unauthorized role cannot transition it.

**Phase 4 — polish + optional Resend (Oct 30).** Bug fixing, accessibility, state and error coverage, optional manual summary email if no critical defects. **Gate:** deployed site ready to record.

**Phase 5 — presentation and submission (Oct 30, well before deadline).** Record <=8 minutes, upload YouTube Unlisted, publish Devpost, complete official form with disclosure. Confirm links in an incognito window. **Gate:** all 3 required submission components completed; keep proof of submission.

**Every phase must end with a tested and committed vertical slice.** No massive single prompt that builds everything without intermediate verification.

---

## 16. Judges-first product narrative and presentation

**Proposed framing (must be adapted to the actual case):** “ReuseFlow replaces opaque device triage with a repeatable, explainable process: intake data, cost-based recommendation, authorized human decision, and measurable workflow reporting.”

Suggested **7:30–7:50** recorded flow (do not exceed the official 8:00 limit):

| Segment | Target duration | Proof |
|---|---:|---|
| Who the company serves and its real case challenge | 0:55 | Cite/quote only permitted public or paraphrased case details |
| Root cause, alternatives considered, proposed solution | 1:05 | Reasoning + why not spreadsheet alone |
| Live ReuseFlow workflow | 2:35 | Intake → reasoned result → human approval → dashboard |
| Scenario Lab + financial assumptions | 1:15 | Show transparent 100-device example and realistic costs |
| Risks, safeguards, phased implementation | 1:00 | Safety, privacy, wipe gate, adoption |
| Key decision and next steps | 0:30 | Concrete pilot proposal |
| **Total** | **7:20** | Buffer for transitions |

**Three sound bites for judges:**

- “The system does not replace technicians; it standardizes decisions and records the reasons.”
- “Every dollar of impact is traceable to an editable assumption—not an invented operational metric.”
- “This is a working vertical slice with safe demo data, real persistence, human approvals, and auditable results.”

### Devpost deliverables checklist

- [ ] Real case challenge matched and limitations disclosed.
- [ ] Team members all eligible and registered; original competition-period work only.
- [ ] GitHub repo link live; README includes setup/stack/demo instructions.
- [ ] Public Vercel `/demo` link tested in incognito on phone and desktop.
- [ ] Published Devpost project page with problem, solution, cost/timeline, team, artifact link.
- [ ] <=8-minute YouTube presentation set to **Unlisted**, link tested in incognito.
- [ ] Official submission form completed (not replaced by Devpost).
- [ ] Honest AI disclosure describing Gemini/Antigravity use and team's own verification.
- [ ] Confirmation email monitored; contact organizers if expected confirmation missing.

---

## 17. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Product misses actual case's challenge | Critical | Case-alignment gate before claiming relevance; adjust narrative/features if needed |
| App looks like generic management dashboard | High | Lead with explainable triage and compelling case-specific outcome |
| Arbitrary rules presented as industry standards | High | Label thresholds as configurable hypotheses, version decisions |
| Incorrect safety/data-wipe assurances | Critical | Hazard quarantine, explicit no-wipe claim, manager verification gate |
| Real data leaks in public demo | Critical | Synthetic browser-only demo, RLS on production, no PII fixtures |
| Scope creep before submission | High | P0/P1/P2, small vertical slices, nightly deploy |
| RLS permissions wrong | High | SQL policy tests, authorized/unauthorized acceptance checks |
| Resend setup delays MVP | Medium | P1 only, demo email preview fallback |
| Unsupported performance/savings claims | High | Editable labeled scenarios, cost and uncertainty disclosure |
| Missing one Devpost component | Critical | Submission checklist with official form, Unlisted link and publication |

---

## 18. Skills required in Antigravity 2.0

Antigravity supports **workspace skills** under `.agents/skills/<skill-folder>/SKILL.md`, each with YAML `name` and `description`. They are loaded contextually; you can also explicitly ask the agent to follow a specific named skill. The accompanying project ZIP includes actual skills as files in the correct folder tree.

| Skill | When to invoke | Expected output |
|---|---|---|
| `case-alignment` | Before implementation or business-case/pitch edits | Evidence register and case-fit decision; never distribute case text |
| `product-ux` | Screens, responsive UI, accessibility, demo story | Reusable screens and interaction checks |
| `decision-engine` | Assessment logic, reason codes, calculations | Tested deterministic domain module |
| `supabase-security` | Schema, Auth, RLS, transitions | Migrations, authorization tests, server repository |
| `resend-email` | Optional email summaries and templates | Safe server-side Resend integration or mock fallback |
| `quality-assurance` | After each vertical slice and before deployment | Tests, repro/fix log, checked acceptance gates |
| `vercel-demo` | GitHub, env vars, demo setup and judging handoff | Deployed app, README, demo script, submission readiness |

**Always-on repository constraints:** use `AGENTS.md` for global guardrails. Skills are for task-specific, reusable procedures. Do not treat an agent skill as permission to access secrets, change Supabase production schema, or send email without human review.

---

## 19. MASTER BUILD PROMPT — paste into Antigravity / Gemini 4 Argon

**Preparation:** Put this `ReuseFlow_PRD.md`, `AGENTS.md`, and `.agents/skills/` into an empty Git repository workspace. Select **Gemini 4 Argon** in Antigravity (High thinking for architecture/design; use default if limited). Then paste the prompt below.

```text
You are the lead senior full-stack engineer, product designer and QA architect
on ReuseFlow — Smart Refurbishment Decision Engine for FUSE Society Blueprint 2026.

SOURCE OF TRUTH:
- Read ./ReuseFlow_PRD.md completely before implementing.
- Read ./AGENTS.md for permanent repository constraints.
- Discover and apply applicable project skills in ./.agents/skills/*/SKILL.md.
- Do not invent any company-specific findings or hackathon rubric details.
- If docs/CASE_ALIGNMENT.md has not been validated against the real case by a
  registered participant, record the uncertainty and continue building a
  GENERIC, clearly labeled demo; do not assert partner endorsement.

STACK IS FIXED:
- Next.js App Router + TypeScript strict mode + Tailwind + shadcn/ui
- Supabase Auth/Postgres/RLS, using current official SSR integration
- Resend server-side only as OPTIONAL P1, never from the public demo
- GitHub repo, Vercel deployment
- User has chosen Google Antigravity 2.0 and Gemini 4 Argon.

PRIMARY PRODUCT:
- Public browser-only fictional data demo at /demo (no credentials, no DB writes)
- Shared device intake/inventory + deterministic explainable v1 rules engine
- Safety and data-sanitization gates + human manager approval + audit trail
- Scenario Lab with explicitly hypothetical impact arithmetic
- Authenticated production /app with Supabase persistence + secure RLS

IMPLEMENTATION PROTOCOL:
1) Inspect repository and report the existing state and a minimal phased plan.
2) Start with schema/types, fixtures, decision-engine unit tests, and one vertical
   slice: create example -> assess -> explain result. Do not start 8 pages at once.
3) Add shared UI and functioning /demo with reset capability.
4) Add Supabase migrations, RLS/grants, Auth, and role-safe production repository;
   verify unauthorized access is denied.
5) Add dashboard, Scenario Lab, workflow approvals/audit, accessibility polish.
6) Only then add Resend optional email if P0 tests/build/deploy are green.
7) Test, typecheck, lint and build after every meaningful feature; fix errors.
8) Create documentation: README, env example, demo script, test report,
   assumptions and AI disclosure notes.
9) Commit in coherent milestones, and provide a Vercel-ready configuration.

HARD RULES:
- Never expose Supabase service/secret keys or RESEND_API_KEY client-side.
- Never fake a working feature or falsely claim a test/deployment succeeded.
- Never send real emails or alter a live database without explicit setup and
  authorization from the user. Never invent credentials.
- No actual data wiping, certified security, or automated recycling actions.
- Use integer cents; version the deterministic decision engine; show reason codes.
- Safety hazards quarantine before economic scoring; insufficient input is review.
- Clearly distinguish example assumptions from proven company outcomes.
- Protect status transitions with server-side authorization and audit events.
- Avoid unnecessary AI APIs; deterministic logic is the core.
- Use responsive, accessible, visually polished operations SaaS design.
- Prefer a reliable demo over more features; P1/P2 must not jeopardize P0.

START NOW with the repo audit, 4–6 milestone plan, and Phase 1 implementation.
When you complete a phase, state files changed, exact commands/tests run,
known blockers, and the next smallest action. Ask only when credentials or a
real-world authorization are genuinely necessary.
```

### 19.1 Follow-up phase prompts (run separately)

**Prompt A — domain first**

```text
Follow the decision-engine skill. Implement validated AssessmentInput/Result
contracts, pure evaluateDevice() with rule version and reason codes, six fixture
cases, and Vitest tests. Keep all math in integer cents. Run tests and typecheck.
Do not build other pages until this is green. Report exact outcomes.
```

**Prompt B — public demo**

```text
Follow the product-ux skill. Build an elegant /demo using the domain module and
synthetic demo repository. Include intake, inventory, assessment explanation,
action timeline, dashboard, Scenario Lab and Reset Demo. No Supabase requests or
real emails from public demo. Show a clear Fictional Sample Data badge. Validate
end-to-end in browser at mobile/desktop sizes and provide screenshots only if
actually captured.
```

**Prompt C — secure data**

```text
Follow the supabase-security skill. Create version-controlled SQL migrations,
RLS grants/policies and role-aware server functions for authenticated /app.
Use current Supabase SSR guidance. Only an authorized manager can finalize
workflow states, and all changes append an event. Add deny-case tests for anon,
viewer and technician. Do not use or display real credentials.
```

**Prompt D — optional email**

```text
Only if all P0 gates are green, follow resend-email skill. Add a manager-only
manual operational-summary email via Resend. Verify from-domain requirements,
recipient allowlist, server-only key, rate limiting and user-visible errors.
For /demo show a non-sending preview. If not configured, degrade gracefully.
```

**Prompt E — release**

```text
Follow quality-assurance and vercel-demo skills. Run lint, typecheck, unit tests,
security smoke checks, production build and browser walkthrough. Fix P0 failures
first. Verify Vercel production/preview environment setup and ensure the public
demo works in an incognito browser. Prepare README, 7:20 demo script, Devpost
submission checklist and honest AI disclosure; do not claim submissions were
made unless actually performed by the participant.
```

---

## 20. References (official links; consulted Oct 28, 2026)

- Hackathon overview and submission requirements: https://fuse-society-blueprint-2026.devpost.com/
- Official competition rules: https://fuse-society-blueprint-2026.devpost.com/rules
- Hackathon resources (competitor packet link): https://fuse-society-blueprint-2026.devpost.com/resources
- Official rubric linked by organizers (contents not verified here): https://docs.google.com/document/d/1XGs1P4wjhXyAEAVToNvFY21LwaZ3uWqcNFEr5AL01sA/edit?usp=sharing
- Antigravity skills format & location: https://antigravity.google/docs/skills
- Antigravity model selector / Gemini 4 Argon: https://antigravity.google/docs/models/
- Supabase Next.js SSR guidance: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Resend Next.js example: https://github.com/resend/resend-examples/tree/main/nextjs-resend-examples
- Vercel environment variables: https://vercel.com/docs/environment-variables

**End of PRD.**
