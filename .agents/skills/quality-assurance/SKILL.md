---
name: quality-assurance
description: Validates ReuseFlow decision math, safety constraints, form usability, Supabase authorization, responsive interface and release readiness with reproducible unit, integration and browser tests. Use after each milestone and before presentation recording.
---

# Quality assurance skill

## Gates
1. Unit: all six fixture outcomes; exact cents; missing input, negative and strange values, safety-first decisions, determinism and Scenario Lab calculations.
2. Integration: server validation, audit event creation, allowed and disallowed state transitions, role checks and RLS deny assertions.
3. Browser: public site CTA -> `/demo` -> new device -> assessment -> explanation -> approval -> timeline -> Scenario Lab -> reset. Verify no Supabase/Resend writes from `/demo`.
4. Accessibility: label/focus/error checks, keyboard navigation, mobile layout, reduced motion if present.
5. Release: no uncaught browser errors; deployed app test in incognito; no broken CTAs; no secrets in client or repository.

## Commands (only if scripts actually exist)
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
Test Supabase policy SQL if configured. Never claim execution without running a command. Report commands, exact pass/fail, remaining P0/P1/P2 defects, and repro steps.

## Red flags
Any fake impact metric, claim of automatic data wiping, public PII, exposed keys, self-elevation of role, nonworking button, or unsafe approval is release-blocking.
