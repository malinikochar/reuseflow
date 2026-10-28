# Official Case Alignment — FUSE Society Blueprint 2026

**Status:** `UNVERIFIED` — The restricted competitor case packet and detailed grading rubric are not bundled in this repository and have not yet been verified by a registered participant inside this file.

> **Important Compliance Guardrail:** Do not paste, upload, or redistribute the restricted FUSE Society Blueprint 2026 case packet in this repository or public Devpost write-up. Registered team members must verify the actual case packet and insert only permitted short paraphrases and internal section references below before final recording.

## One-sentence assigned problem (paraphrase)
`[UNVERIFIED HYPOTHESIS — Participant to validate against official packet]: Electronics reuse organizations face inconsistent manual device intake and triage, making it difficult to standardize repair vs. recycle-review decisions, track technician labor economics, enforce safety/data-sanitization gates, and quantify operational throughput.`

## Evidence register
| Claim / Fact (paraphrase) | Source section / allowable reference | Verified or assumed? |
|---|---|---|
| Partner organization operates community electronics reuse/refurbishment workflows | Public Devpost competition overview | Verified (public overview only) |
| Specific bottleneck in case involves device triage consistency, cost visibility, or workflow tracking | Official Case Packet (Section TBD by participant) | **Assumed — Requires participant validation** |
| Baseline manual assessment time is 12 minutes vs. 6 minutes with structured rules | Illustrative Scenario Lab seed default (`ReuseFlow_PRD.md` §6.2, §10) | **Assumed (Hypothetical scenario only)** |
| Loaded technician labor rate is $20/hour and target minimum margin is $20 | Illustrative engine config (`ReuseFlow_PRD.md` §6.2) | **Assumed (Configurable hypothesis)** |

## Problem-to-feature mapping
| Root cause hypothesis | ReuseFlow feature | Proposed outcome metric | Why needed |
|---|---|---|---|
| Ad-hoc triage decisions vary across volunteers and technicians | Versioned deterministic rules engine (`v1.0.0`) with explicit reason codes | % of intake devices receiving standardized, auditable triage reasons | Eliminates opaque guesswork without relying on black-box AI |
| Hidden repair labor and parts costs erode refurbishment margin | Integer-cents cost breakdown + interactive "What if?" parts simulator | Estimated net repair margin per device before committing technician hours | Prevents spending high labor/parts budget on negative-margin hardware |
| Swollen batteries or unverified storage create safety/privacy exposure | Pre-economic `QUARANTINE` safety gate + separate manager-verified `Sanitization` gate | 0 storage-bearing devices marked `ready`/`closed` without recorded verification | Enforces human accountability for physical safety and external data wipe steps |
| Leadership lacks visibility into throughput and time-savings trade-offs | Operations dashboard + interactive `Scenario Lab` with editable assumptions | Modelled monthly technician hours reallocated based on transparent inputs | Separates measured inventory counts from clearly labeled financial hypotheses |

## Alternatives considered
- **Non-software process improvement (printed paper checklists):** Low upfront cost and zero training barrier, but produces no searchable audit trail, requires manual arithmetic for labor/parts margin, and cannot automatically block premature status closure when storage sanitization is pending.
- **Spreadsheet / shared form template:** Easy to start, but fragile under concurrent edits, lacks role-based transition guards (technician vs. manager approval), allows silent overwriting of historical assessments, and mixes donor/device data without row-level security.
- **Full ERP / automated hardware diagnostic suite:** High licensing and integration overhead, steep volunteer learning curve, and overkill for rapid triage decision support.
- **ReuseFlow MVP (Selected):** Focused decision-support web app combining fast 90-second intake, deterministic cost/margin rules, immutable assessment snapshots, role-guarded workflow approvals, and an isolated zero-credential demo.

## Pilot hypothesis and risks
- **Pilot population:** 1 intake bench (2–3 technicians, 1 refurbishment manager) triaging 100 donated laptops/desktops/tablets over a 4-week pilot.
- **Cost/timeline assumptions:** 2-week configuration and staff onboarding; low-cost cloud hosting (Vercel + Supabase free/pro tier); all Scenario Lab payback calculations explicitly require adding realistic implementation and monthly operating costs.
- **Baseline data required:** Actual average manual triage duration (minutes/device), historical refurbishment yield %, and standard organizational labor/parts cost tables.
- **Privacy/safety constraints:** ReuseFlow **never** performs data wiping or certifies destruction; it only records a manager's assertion that an external sanitization procedure was completed. Swollen batteries immediately trigger `QUARANTINE` under organizational safety procedures. Public `/demo` uses 100% synthetic data with zero PII or real serial numbers.

## Go / Pivot / Stop Gate
- **Current status:** `PROCEED WITH GENERIC LABELED DEMO (PENDING PARTICIPANT CASE PACKET CHECK)`
- **Rejection test:** If the official FUSE Society Blueprint 2026 case packet centers on a challenge unrelated to device intake/refurbishment operations (e.g., purely donor marketing or retail storefront foot traffic), the team must pivot the narrative and Scenario Lab KPIs before recording the final presentation.
