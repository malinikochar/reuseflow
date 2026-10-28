---
name: decision-engine
description: Implements and tests ReuseFlow's pure deterministic refurbishment rules, reason codes, safety/handling gates, versioned configuration, cents arithmetic and representative fixtures. Use for recommendation logic and financial calculations.
---

# Deterministic decision-engine skill

## Invariants
- Read PRD sections 6–7 and use `evaluateDevice(input, config)` as a pure function.
- Return explicit decision, stable reason codes, breakdown in integer cents, rule version `1.0.0` and `requiresHumanApproval: true`.
- `batterySafety=swollen` -> `QUARANTINE` **before** any economics.
- Missing required fields -> `INSUFFICIENT_DATA`; unknown is not zero.
- Economically viable safe devices may become `REFURBISH_CANDIDATE`; negative-margin irreparable devices only become `RECYCLE_REVIEW`, not actual recycling.
- Data-sanitization gate is separate from refurbishment economics; storage-bearing pending status blocks ready/closed.
- Thresholds are configurable *illustrative assumptions*, not industry-certified standards.
- No AI API, fake confidence scores, unverified prices or invented carbon savings.

## Build protocol
1. Write strict domain types and Zod validation.
2. Implement defaults and priority-ordered rules with readable reason strings.
3. Use reproducible input and rules snapshots; do not overwrite assessments.
4. Create all six PRD fixtures and unit tests for missing/negative/zero/overflow/rounding cases.
5. Expose `Why this result?` explanations with inputs, explicit reasons, cost breakdown, human-approval requirement.
6. Reuse the same engine in public demo and server-side Supabase assessment.

## Exit gate
Target unit tests and typecheck pass; safety dominance and deterministic outputs are asserted; changes to fixture inputs change displayed outcomes.
