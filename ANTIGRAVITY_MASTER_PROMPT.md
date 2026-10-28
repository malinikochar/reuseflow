# Antigravity 2.0 / Gemini 4 Argon — ReuseFlow Master Prompt

Copy the prompt block below **after extracting** the full workspace pack into the repository root. The full scope and milestones are in `ReuseFlow_PRD.md`.

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

## Follow-up prompts

See `ReuseFlow_PRD.md` §19.1 for five phase-specific prompts: domain engine, public demo, secure Supabase persistence, optional Resend, and release.
