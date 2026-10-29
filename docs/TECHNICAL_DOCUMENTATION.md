# ReuseFlow — Comprehensive Technical Architecture & Engineering Documentation

<p align="center">
  <img src="../public/TechnicalStack.png" alt="ReuseFlow Layered Technical Stack" width="100%" />
</p>

<p align="center">
  <a href="https://reuseflow.vercel.app"><strong>Live Production App</strong></a> ·
  <a href="https://reuseflow.vercel.app/demo"><strong>Zero-Login Judge Sandbox (/demo)</strong></a> ·
  <a href="https://youtu.be/TsD79yBawuQ"><strong>Watch 2-Min Demo Video (YouTube)</strong></a>
</p>

> [!IMPORTANT]
> **Scope, Safety & Claim Discipline:** ReuseFlow is an open-source (`GPL-3.0`) hackathon MVP proposing a standardized refurbishment triage and decision-support workflow. It is **not** an official operational system of Free Geek, **never** performs certified device data wiping or automated hardware disposal, and requires **human supervisor approval** for all disposition and sanitization gates. Financial thresholds in Engine `v1.0.0` and Scenario Lab are transparent, editable hypotheses rather than industry standards.

---

## Table of Contents

1. [System Context & Architectural Principles](#1-system-context--architectural-principles)
2. [High-Level System Architecture Diagram](#2-high-level-system-architecture-diagram)
3. [End-to-End Operational Triage Flow](#3-end-to-end-operational-triage-flow)
4. [Deterministic Decision Engine (`v1.0.0`) Specification](#4-deterministic-decision-engine-v100-specification)
5. [Human-Approved Workflow State Machine & Safety Gates](#5-human-approved-workflow-state-machine--safety-gates)
6. [Advisory AI & Live Web Research Copilot Sequence](#6-advisory-ai--live-web-research-copilot-sequence)
7. [Database Schema, Constraints & Row-Level Security (ERD)](#7-database-schema-constraints--row-level-security-erd)
8. [Dual-Mode Repository Isolation (`/demo` vs `/app`)](#8-dual-mode-repository-isolation-demo-vs-app)
9. [Codebase Directory Structure & Module Responsibilities](#9-codebase-directory-structure--module-responsibilities)
10. [Server Actions, HTTP API Endpoints & Error Taxonomy](#10-server-actions-http-api-endpoints--error-taxonomy)
11. [Scenario Lab Mathematical Model](#11-scenario-lab-mathematical-model)
12. [Security, Safety & Verification Matrix](#12-security-safety--verification-matrix)

---

## 1. System Context & Architectural Principles

ReuseFlow is engineered around six strict architectural invariants:

1. **Single Shared Domain & Pure Engine:** Both the zero-login public sandbox (`/demo`) and the authenticated staff workspace (`/app`) share identical TypeScript domain contracts (`src/types/domain.ts`), Zod schemas (`src/lib/validation/schemas.ts`), UI components (`src/components/`), and the pure deterministic decision engine (`src/lib/decision/engine.ts`).
2. **Integer-Cents Financial Precision:** Every monetary value (`partsCostCents`, `laborCostCents`, `overheadCents`, `comparableValueCents`, `marginCents`) is validated, computed, and persisted in integer cents—eliminating IEEE-754 floating-point drift.
3. **Safety Dominance Over Economics:** Physical lithium-ion hazard checks (`batterySafety === 'swollen'`) execute *before* any cost or margin calculation, immediately locking refurbishment pathways and routing the unit to `QUARANTINE`.
4. **Decoupled External Data Sanitization Gate:** Economic viability (`REFURBISH_CANDIDATE`) never implies data readiness. Any storage-bearing device (`storagePresent = true`) is blocked at both the application guard layer and PostgreSQL `CHECK` constraint layer from reaching `ready` or `closed` until a manager records human verification of an externally completed sanitization procedure.
5. **Advisory-Only AI Boundary:** Live web market comp lookups (**Tavily Search API**) and technical synthesis (**Nebius TokenFactory LLM**) operate strictly as an optional bench copilot. AI output never mutates device records or overrides deterministic rules without explicit human confirmation.
6. **Defence-in-Depth Persistence:** Every authenticated mutation validates session identity on the server via `@supabase/ssr` (`supabase.auth.getUser()`), checks Zod schemas, enforces role-based guards (`manager`, `technician`, `viewer`), executes inside PostgreSQL Row-Level Security (`created_by = auth.uid()`), and records append-only `assessments` and `workflow_events`.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Browser Client Layer (Desktop and 375px Mobile)"]
        LP["Landing Page (/)"]
        DEMO["Public Judge Sandbox (/demo) - Synthetic Local State"]
        LOGIN["Auth Portal (/login) - Sign In, Register and 1-Click Demo"]
        APP["Authenticated Staff Workspace (/app) - Role-Aware Portal"]
    end

    subgraph SharedCore["Shared Pure Domain and UI Layer (src/)"]
        UI["Shared React 19 + Tailwind v4 Components"]
        ZOD["Zod Validation Schemas (schemas.ts)"]
        ENG["Deterministic Rule Engine v1.0.0 (Integer Cents)"]
        GUARDS["Workflow and Sanitization Guards (workflow-guards.ts)"]
    end

    subgraph Adapters["Repository and Server Boundary"]
        DEMOREPO["DemoDeviceRepository (localStorage - Zero Network Writes)"]
        SUPAREPO["SupabaseDeviceRepository (Server Actions + SSR Auth)"]
        RESAPI["POST /api/research/device-intel (Advisory Copilot Route)"]
        EMAILAPI["POST /api/reports/send-summary (Manager Digest Route)"]
    end

    subgraph External["Managed Cloud and External Services (Server-Only Keys)"]
        SUPADB[("Supabase PostgreSQL + Auth + RLS + Append-Only Triggers")]
        TAVILY["Tavily Search API (Live Cited Comps and Repair Guides)"]
        NEBIUS["Nebius TokenFactory LLM (Qwen3-30B-A3B Synthesis)"]
        RESEND["Resend Email API (Allowlisted Digests and Auth Emails)"]
    end

    LP --> DEMO
    LP --> LOGIN
    LOGIN --> APP
    DEMO --> UI
    APP --> UI
    UI --> ZOD
    UI --> ENG
    UI --> GUARDS

    DEMO --> DEMOREPO
    DEMOREPO -. "Isolated in Browser Only" .-> DEMO

    APP --> SUPAREPO
    SUPAREPO --> SUPADB

    UI --> RESAPI
    RESAPI --> TAVILY
    RESAPI --> NEBIUS

    APP --> EMAILAPI
    EMAILAPI --> RESEND
    SUPAREPO --> RESEND
```

---

## 3. End-to-End Operational Triage Flow

<p align="center">
  <img src="../public/How%20ReuseFlow%20Works.png" alt="How ReuseFlow Works — 7-Step Refurbishment Decision Workflow" width="100%" />
</p>

```mermaid
flowchart LR
    S1["1. Access Portal (/demo or /app)"] --> S2["2. 90s Device Intake & Specs"]
    S2 --> S3{"3. Swollen Battery?"}
    S3 -- "Yes (Hazard)" --> Q["QUARANTINE (Economics Bypassed)"]
    S3 -- "No (Safe)" --> S4{"4. Critical Inputs Complete?"}
    S4 -- "Missing Comp" --> S5["5. AI & Web Copilot (Human Confirmed)"]
    S5 --> S6["6. Engine v1.0.0 (Cents Cost & Margin)"]
    S4 -- "Complete" --> S6
    S6 --> S7["7. Human Manager Approval & Wipe Gate"]
```

---

## 4. Deterministic Decision Engine (`v1.0.0`) Specification

Implemented in `src/lib/decision/engine.ts` (`evaluateDevice`), the engine is a pure function with zero network dependencies and deterministic outputs across all 6 canonical PRD fixtures (`Case A`–`Case F`).

### 4.1 Decision Priority Flowchart

```mermaid
flowchart TD
    START(["evaluateDevice(input, config v1.0.0, sanitizationStatus)"]) --> ZOD["Step 1: Zod Schema Validation"]
    ZOD --> GATE8["Evaluate Sanitization Gate: !storagePresent OR status == verified"]
    GATE8 --> P1{"Priority 1: batterySafety == swollen?"}

    P1 -- "Yes" --> OUT_Q["QUARANTINE (SAFETY_BATTERY_SWOLLEN, costBreakdown: null)"]

    P1 -- "No" --> P2{"Priority 2: Missing boots, repairable, parts, labor, or comp?"}
    P2 -- "Yes" --> OUT_ID["INSUFFICIENT_DATA (MISSING_CRITICAL_INPUTS + missingFields)"]

    P2 -- "No" --> ECON["Compute Integer-Cents Cost & Margin: margin = comp - (parts + labor + overhead)"]

    ECON --> P3{"Priority 3: condition == unknown OR batterySafety == unknown?"}
    P3 -- "Yes" --> OUT_R1["REVIEW_REQUIRED (UNVERIFIED_CONDITION / AMBIGUOUS_BATTERY_SAFETY)"]

    P3 -- "No" --> P4{"Priority 4: repairable == false AND marginCents < 0?"}
    P4 -- "Yes" --> OUT_REC["RECYCLE_REVIEW (NOT_REPAIRABLE_AND_NEGATIVE_MARGIN)"]

    P4 -- "No" --> P5{"Priority 5: boots & repairable & margin >= minMargin & RAM >= minRam?"}
    P5 -- "Yes" --> OUT_REF["REFURBISH_CANDIDATE (VIABLE_COST_AND_FUNCTION)"]

    P5 -- "No" --> OUT_R2["REVIEW_REQUIRED (BOOT_FAILURE / LOW_RAM / BELOW_MARGIN_THRESHOLD)"]

    OUT_Q --> SAN_TAG["Append SANITIZATION_GATE_PENDING if !sanitizationGateOpen"]
    OUT_ID --> SAN_TAG
    OUT_R1 --> SAN_TAG
    OUT_REC --> SAN_TAG
    OUT_REF --> SAN_TAG
    OUT_R2 --> SAN_TAG
    SAN_TAG --> DONE(["Return Immutable AssessmentResult (requiresHumanApproval: true)"])
```

### 4.2 Default Configurable Rule Parameters (`v1.0.0`)

| Parameter | Field | Seed Default | Representation | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Rule Version** | `ruleVersion` | `'1.0.0'` | SemVer String | Stored on every immutable `AssessmentRecord` |
| **Loaded Labor Rate** | `hourlyRateCents` | `2000` (`$20.00/hr`) | Integer Cents | Converts `estimatedLaborMinutes` into bench labor cost |
| **Minimum Net Margin** | `minMarginCents` | `2000` (`$20.00`) | Integer Cents | Minimum positive surplus for `REFURBISH_CANDIDATE` |
| **Laptop RAM Floor** | `minLaptopRamGb` | `8` (`8 GB`) | Integer GB | Flags `< 8 GB` or unknown laptop RAM for human review |
| **Processing Overhead** | `overheadCents` | `0` (`$0.00`) | Integer Cents | Optional per-unit shop floor overhead allocation |
| **Manual Baseline Time** | `baselineMinutes` | `12` (`12 min`) | Integer Minutes | Scenario Lab baseline manual triage assumption |
| **Assisted Target Time** | `targetMinutes` | `6` (`6 min`) | Integer Minutes | Scenario Lab assisted triage target assumption |

---

## 5. Human-Approved Workflow State Machine & Safety Gates

Implemented in `src/lib/decision/workflow-guards.ts` (`validateWorkflowTransition`, `validateSanitizationUpdate`) and mirrored inside PostgreSQL transactional RPCs and table `CHECK` constraints.

```mermaid
stateDiagram-v2
    [*] --> intake : Device Created (Technician / Manager)

    intake --> assessed : Run Assessment (Tech / Manager)
    intake --> quarantined : Swollen Battery / Safety Hold (Tech / Manager)

    assessed --> approved_refurb : Approve Refurbishment [Manager Only · Safe Battery · Valid Inputs]
    assessed --> recycle_review : Route to Recycle Review [Manager Only]
    assessed --> quarantined : Safety Hold (Tech / Manager)
    assessed --> intake : Return for Intake Details (Tech / Manager)

    approved_refurb --> repairing : Start Bench Repair (Tech / Manager)
    approved_refurb --> assessed : Re-open Assessment (Tech / Manager)

    repairing --> ready : Mark Ready [Manager Only · Verified Sanitization Gate]
    repairing --> assessed : Return to Assessment (Tech / Manager)
    repairing --> quarantined : Bench Safety Hazard (Tech / Manager)

    quarantined --> assessed : Safety Clearance Release [Manager Only]

    recycle_review --> closed : Close w/ Disposition [Manager Only · Verified Sanitization Gate]
    recycle_review --> assessed : Return to Assessment (Tech / Manager)

    ready --> closed : Close w/ Disposition [Manager Only · Verified Sanitization Gate]
    ready --> assessed : Return to Assessment (Tech / Manager)

    closed --> [*] : Terminal Audit Record
```

### Mandatory Pre-Transition Invariants
- **Optimistic Concurrency (`CONFLICT`):** Every transition supplies `expectedStatus`; stale browser tabs are rejected rather than overwriting concurrent updates.
- **Role Matrix (`FORBIDDEN`):**
  - `viewer`: Strictly read-only across UI, Server Actions, and Postgres RLS.
  - `technician`: Can intake devices, edit intake specs, run assessments, move `approved_refurb -> repairing`, or place devices into `quarantined`.
  - `manager`: Required to approve refurbishment (`approved_refurb`), route to `recycle_review`, verify external sanitization, release from `quarantined`, mark `ready`, or close (`closed`) with a recorded `Disposition` (`distributed`, `recycled`, `other_authorized`).
- **Mandatory Audit Note:** Every status transition requires a non-empty human note (`>= 3` characters) persisted to `workflow_events`.

---

## 6. Advisory AI & Live Web Research Copilot Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Tech as Technician / Manager
    participant UI as DeviceResearchPanel (Client)
    participant API as POST /api/research/device-intel
    participant Tavily as Tavily Search API
    participant Nebius as Nebius TokenFactory LLM
    participant Engine as evaluateDevice (v1.0.0)

    Tech->>UI: Select Queue Unit (e.g., FG-DEMO-105 Missing Comp) & Click "Run Live Web & AI Bench Research"
    UI->>API: Validated JSON { brand, model, category, ramGb, storageGb, focusQuery }
    API->>API: Zod validation + sanitize prompt inputs (zero PII / serials)
    API->>Tavily: Search refurbished secondary-market comps & teardown repairability guides
    Tavily-->>API: Cited web snippets + source URLs
    API->>Nebius: Prompt Qwen/Qwen3-30B-A3B-Instruct-2507 with hardware specs + Tavily citations
    Nebius-->>API: Structured JSON { conservativeLow, suggestedMidpoint, retailHigh, partsGuidance, summary }
    Note over API: Deterministic spec-tier fallback executes gracefully if external APIs are offline
    API-->>UI: Advisory Research Brief + Live Clickable Citations
    Tech->>UI: Reviews citations & clicks "Apply Suggested Comp & Re-Evaluate"
    UI->>Engine: Pass human-confirmed comparableValueCents into deterministic v1.0.0 engine
    Engine-->>UI: Updated explainable AssessmentResult (still requires Manager approval)
```

---

## 7. Database Schema, Constraints & Row-Level Security (ERD)

Defined across `supabase/migrations/20261028000001_initial_schema_and_rls.sql` and `supabase/migrations/20261029000001_user_accounts_and_auth_flows.sql`, verified by `supabase/tests/rls_verification.sql`.

```mermaid
erDiagram
    PROFILES ||--o| USER_SETTINGS : "configures (1:1)"
    PROFILES ||--o{ DEVICES : "owns workspace (created_by)"
    PROFILES ||--o{ ASSESSMENTS : "records (assessed_by)"
    PROFILES ||--o{ WORKFLOW_EVENTS : "audits (actor_id)"
    PROFILES ||--o{ EMAIL_EVENTS : "triggers (sent_by)"
    DEVICES ||--o{ ASSESSMENTS : "has immutable snapshots"
    DEVICES ||--o{ WORKFLOW_EVENTS : "has append-only log"

    PROFILES {
        uuid id PK "FK -> auth.users(id)"
        text email
        text display_name
        text department
        text job_title
        text phone
        text location
        text bio
        user_role role "manager | technician | viewer"
        timestamptz created_at
        timestamptz updated_at
    }

    USER_SETTINGS {
        uuid user_id PK "FK -> profiles(id)"
        text rule_version "default 1.0.0"
        int hourly_rate_cents "default 2000"
        int min_margin_cents "default 2000"
        int min_laptop_ram_gb "default 8"
        int overhead_cents "default 0"
        int baseline_minutes "default 12"
        int target_minutes "default 6"
    }

    DEVICES {
        uuid id PK
        text asset_tag "UNIQUE(created_by, asset_tag)"
        device_category category "laptop | desktop | tablet"
        text brand
        text model
        int ram_gb
        int storage_gb
        boolean boots
        device_condition condition
        battery_safety battery_safety
        boolean storage_present
        boolean repairable
        int parts_cost_cents
        int estimated_labor_minutes
        int comparable_value_cents
        sanitization_status sanitization_status
        uuid sanitization_verified_by FK
        workflow_status status
        disposition_type disposition
        uuid created_by FK "Workspace Isolation Key"
    }

    ASSESSMENTS {
        uuid id PK
        uuid device_id FK
        text rule_version
        jsonb input_snapshot "Immutable JSONB"
        jsonb config_snapshot "Immutable JSONB"
        decision_outcome decision
        text[] reason_codes
        int repair_cost_cents
        int margin_cents
        boolean sanitization_gate_open
        uuid assessed_by FK
        timestamptz created_at "Append-Only Trigger"
    }

    WORKFLOW_EVENTS {
        uuid id PK
        uuid device_id FK
        workflow_status from_status
        workflow_status to_status
        uuid actor_id FK
        user_role actor_role
        text note
        timestamptz created_at "Append-Only Trigger"
    }

    EMAIL_EVENTS {
        uuid id PK
        text event_type
        text recipient
        text idempotency_key UK
        text status "sent | failed | skipped"
        uuid sent_by FK
        timestamptz created_at
    }
```

### Hardened PostgreSQL Controls
- **Zero Anonymous Access:** `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;` ensures unauthenticated PostgREST requests cannot read or mutate production tables.
- **Per-User Account Isolation (`created_by = auth.uid()`):** Every registered user automatically receives an isolated workspace seeded via `public.ensure_user_workspace_seeded()` with personal `user_settings` and starter triage fixtures, preventing cross-account data leakage during multi-judge testing.
- **Privilege Escalation Prevention:** Column-level grants on `public.profiles` permit users to update `display_name`, `department`, `job_title`, `phone`, `location`, and `bio`, while blocking self-promotion of `role`.
- **Append-Only Audit Triggers:** `BEFORE UPDATE OR DELETE` triggers on `public.assessments` and `public.workflow_events` raise a PostgreSQL exception, guaranteeing tamper-evident operational history.
- **Database-Level Safety `CHECK` Constraints:**
  - `devices_sanitization_gate_check`: Blocks `status IN ('ready', 'closed')` when `storage_present = true AND sanitization_status <> 'verified'`.
  - `devices_battery_safety_gate_check`: Blocks `status IN ('approved_refurb', 'repairing', 'ready')` when `battery_safety = 'swollen'`.
  - `devices_closed_disposition_check`: Blocks `status = 'closed'` when `disposition IS NULL`.

---

## 8. Dual-Mode Repository Isolation (`/demo` vs `/app`)

| Capability | Public Judge Sandbox (`/demo`) | Authenticated Staff Workspace (`/app`) |
| :--- | :--- | :--- |
| **Authentication Required** | None — instant zero-login access | Required (`@supabase/ssr` cookie session + `/login`) |
| **Repository Adapter** | `DemoDeviceRepository` (`src/lib/repositories/demo-repository.ts`) | `SupabaseDeviceRepository` (`src/lib/repositories/supabase-repository.ts`) |
| **State Storage** | Browser `localStorage` (`reuseflow_demo_state_v1`) | Supabase PostgreSQL with RLS & transactional RPCs |
| **Supabase Writes** | **Never** (0 database reads or writes) | Authorized via Server Actions & verified `auth.getUser()` |
| **Email Dispatch** | Simulated preview card only (**never** calls Resend) | Real server-side Resend delivery (allowlisted / auth flows) |
| **Role Switching** | Instant interactive Role Simulator (`Manager`, `Technician`, `Viewer`) | Enforced from `public.profiles.role` in PostgreSQL |
| **Reset Capability** | 1-Click **"Reset Demo Sandbox"** restores canonical Cases `A`–`F` | Persistent per-account data with profile & settings management |

---

## 9. Codebase Directory Structure & Module Responsibilities

```text
reuseflow/
├── public/                                  # Visual product architecture & feature showcase banners
├── docs/
│   ├── TECHNICAL_DOCUMENTATION.md           # Full architecture, engine & security reference (this document)
│   ├── CASE_ALIGNMENT.md                    # FUSE Society Blueprint case fit & claim guardrails
│   ├── DEMO_SCRIPT.md                       # Presentation walkthrough & timing script
│   ├── TEST_REPORT.md                       # Unit, integration, RLS & Playwright E2E test evidence
│   └── AI_DISCLOSURE.md                     # Transparent hackathon AI-use disclosure
├── supabase/
│   ├── migrations/
│   │   ├── 20261028000001_initial_schema_and_rls.sql
│   │   └── 20261029000001_user_accounts_and_auth_flows.sql
│   ├── seed.sql                             # Optional local/staging fixture seed
│   └── tests/rls_verification.sql           # SQL verification of RLS & anon privilege revocation
├── src/
│   ├── middleware.ts                        # Supabase SSR session refresh & /app route protection
│   ├── types/domain.ts                      # Canonical TypeScript domain types (cents, enums, records)
│   ├── fixtures/demo-devices.ts             # Canonical PRD Cases A–F synthetic fixtures
│   ├── app/
│   │   ├── page.tsx                         # Executive landing page & live Case A telemetry preview
│   │   ├── demo/page.tsx                    # Zero-login isolated browser sandbox
│   │   ├── login/page.tsx                   # Sign-in, registration, password reset & 1-click demo login
│   │   ├── app/                             # Authenticated staff operations portal & sub-routes
│   │   └── api/
│   │       ├── research/device-intel/route.ts   # Server-only Tavily + Nebius bench research endpoint
│   │       └── reports/send-summary/route.ts    # Manager-only Resend operational summary endpoint
│   ├── components/
│   │   ├── layout/operations-workspace.tsx  # Unified tabbed operations shell (/demo & /app)
│   │   ├── devices/                         # Intake form, quick-edit, triage queue table, audit dialogs
│   │   ├── assessments/assessment-panel.tsx # Rule reason codes, cost breakdown & What-If simulator
│   │   ├── research/device-research-panel.tsx   # Human-in-the-loop AI & web comps copilot UI
│   │   ├── analytics/                       # SVG telemetry charts, Scenario Lab & email summary panel
│   │   ├── profile/profile-and-admin-panel.tsx  # User profile editor, password update & admin governance
│   │   └── shared/                          # Brand mark (ReuseFlowLogo) & semantic status badges
│   └── lib/
│       ├── decision/                        # Pure engine.ts, scenario.ts & workflow-guards.ts
│       ├── validation/schemas.ts            # Shared client/server Zod schemas
│       ├── repositories/                    # Repository interface + Demo & Supabase implementations
│       ├── actions/                         # Verified Next.js Server Actions (device & profile/admin)
│       ├── auth/session.ts                  # Server-side actor & role verification helper
│       ├── research/device-research-service.ts  # Tavily Search + Nebius TokenFactory service + fallback
│       └── email/                           # Resend operational digest & transactional welcome/reset emails
└── tests/
    ├── unit/                                # Engine math, edge cases, workflow guards & Scenario Lab
    ├── integration/                         # Repository isolation, RBAC & email allowlist gates
    └── e2e/                                 # Playwright desktop & 375px mobile browser verification
```

---

## 10. Server Actions, HTTP API Endpoints & Error Taxonomy

### 10.1 Verified Server Actions (`src/lib/actions/`)
- `listDevicesServerAction(filters)` — Fetches authenticated user's isolated device queue, assessments, and workflow history.
- `createDeviceServerAction(payload)` — Validates intake via Zod, inserts device, runs initial `v1.0.0` assessment, and appends initial `intake` event.
- `updateDeviceIntakeServerAction(deviceId, payload)` — Updates mutable hardware/cost inputs, appends a new immutable `AssessmentRecord`, and preserves historical snapshots.
- `transitionWorkflowServerAction(payload)` — Validates `expectedStatus`, role permissions, battery safety, and sanitization gates before executing atomic status transition + `workflow_events` insert.
- `verifySanitizationServerAction(payload)` — Manager-only action recording external wipe verification method/reference (`sanitization_status = 'verified'`).
- `batchReassessAllServerAction(config)` — Re-evaluates active queue against updated `EngineConfig` assumptions by appending new snapshots.
- `updateOwnProfileServerAction(payload)` & `changePasswordServerAction(payload)` — Authenticated profile & credential self-service.
- `registerStaffAccountServerAction(payload)` & `requestPasswordRecoveryServerAction(payload)` — Account provisioning with automatic workspace seeding and transactional Resend welcome/recovery email dispatch.

### 10.2 HTTP Route Handlers (`src/app/api/`)
- `POST /api/research/device-intel`: Validates hardware query via Zod, queries Tavily Search API + Nebius TokenFactory LLM using server-only keys, and returns structured comparable pricing + repairability guidance with fallback resilience.
- `POST /api/reports/send-summary`: Verifies `manager` session on server, checks `REPORT_RECIPIENT_ALLOWLIST`, enforces per-user rate-limiting and idempotency keys, dispatches plain-text/HTML operational digest via Resend SDK, and logs outcome in `public.email_events`.

### 10.3 Standardized `ActionResponse<T>` Error Taxonomy

| Code | HTTP Equivalent | Meaning |
| :--- | :--- | :--- |
| `VALIDATION` | `400 Bad Request` | Zod field validation failure or locked safety/sanitization gate |
| `UNAUTHORIZED` | `401 Unauthorized` | Missing or expired `@supabase/ssr` user session |
| `FORBIDDEN` | `403 Forbidden` | Authenticated actor lacks required `UserRole` (`viewer` or non-`manager`) |
| `CONFLICT` | `409 Conflict` | Duplicate `asset_tag` or stale `expectedStatus` optimistic concurrency mismatch |
| `FAILED_DEPENDENCY` | `424 Failed Dependency` | Upstream optional email/research provider error (core triage remains unaffected) |
| `INTERNAL` | `500 Internal Error` | Unexpected server exception (sanitized message returned to client) |

---

## 11. Scenario Lab Mathematical Model

Implemented in `src/lib/decision/scenario.ts` (`calculateScenario`), all Scenario Lab projections are computed deterministically from user-editable sliders and labeled as **illustrative operational capacity estimates**:

- **Minutes Saved per Device:**
  $$\Delta t = t_{\text{baseline}} - t_{\text{proposed}}$$
- **Monthly Hours Reallocated:**
  $$H_{\text{month}} = \frac{N_{\text{devices}} \times \Delta t}{60}$$
- **Monthly Hypothetical Labor Capacity Value (in cents):**
  $$V_{\text{labor}} = \text{round}\!\left(H_{\text{month}} \times R_{\text{hourly\_cents}}\right)$$
- **Net Monthly Capacity Value (in cents):**
  $$V_{\text{net}} = V_{\text{labor}} - C_{\text{monthly\_software\_cents}}$$
- **Simple Payback Period (months):**
  - If $C_{\text{implementation\_cents}} = 0$ and $V_{\text{net}} > 0$: Immediate (`0.0 months`, with explicit UI prompt to enter realistic pilot training/setup costs).
  - If $V_{\text{net}} \le 0$: `null` (`No positive payback under current assumptions`).
  - Otherwise: $P = C_{\text{implementation\_cents}} / V_{\text{net}}$.

---

## 12. Security, Safety & Verification Matrix

| Control Domain | Implementation File(s) | Automated Verification (`36/36` Unit & Integration Tests) |
| :--- | :--- | :--- |
| **Deterministic Cents & Rules (`v1.0.0`)** | `src/lib/decision/engine.ts` | `tests/unit/decision-engine.test.ts` (9 tests) |
| **Input & Config Schema Bounds** | `src/lib/validation/schemas.ts` | `tests/unit/validation.test.ts` (7 tests) |
| **State Machine, RBAC & Sanitization Gates** | `src/lib/decision/workflow-guards.ts` | `tests/integration/workflow-security.test.ts` (5 tests) |
| **Scenario Lab Capacity Math** | `src/lib/decision/scenario.ts` | `tests/unit/scenario-lab.test.ts` (3 tests) |
| **AI & Web Copilot + Offline Fallback** | `src/lib/research/device-research-service.ts` | `tests/unit/device-research.test.ts` (4 tests) |
| **Sandbox Zero-Leak Isolation** | `src/lib/repositories/demo-repository.ts` | `tests/unit/demo-repository.test.ts` (2 tests) |
| **Resend Allowlist, RBAC & Rate Limit** | `src/lib/email/resend-service.ts` | `tests/integration/resend-email.test.ts` (6 tests) |
| **Postgres RLS & Anon Revocation** | `supabase/migrations/*.sql` | `supabase/tests/rls_verification.sql` |
| **End-to-End Desktop & Mobile Flows** | `src/app/`, `src/components/` | `tests/e2e/` (Playwright) |
