# ReuseFlow repository instructions — always active

## Source and purpose
- The main specification is `ReuseFlow_PRD.md`. For task-specific guidance, read applicable `.agents/skills/<name>/SKILL.md` files.
- This is a hackathon MVP for a *proposed* refurbishment decision-support workflow, not an actual Free Geek operational system.
- The official case packet is not bundled. Do not claim its findings have been verified. Keep case-specific interpretation in `docs/CASE_ALIGNMENT.md`, using a participant's permitted paraphrase only.
- The competition rewards case fit and business reasoning, not complexity. Protect the end-to-end demo first.

## Technical decisions
- Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, Zod.
- Pure, deterministic assessment logic; reusable fixtures and unit tests; money in integer cents.
- Supabase Postgres/Auth with current SSR guidance and proper RLS/grants, verified server identity and role checks.
- Public `/demo` reads/writes only synthetic browser-local state and never writes to Supabase or sends Resend email.
- Authenticated `/app` uses authorized data access and append-only assessments/workflow events.
- Resend email is P1, manager-triggered, server-only, allowlisted, never required for core flows.
- Vercel deployment from GitHub; no secrets committed, and no claim that deployment/test succeeded unless checked.

## Safety and integrity
- Never imply the app performs certified device wipes or automatic recycling/disposal.
- Swollen battery triggers quarantine; staff and organizational safety processes are authoritative.
- Storage-bearing device cannot reach ready/closed until human-verified sanitization is recorded; this record is not a wipe certificate.
- All final recommendations require human approval. The economic engine's thresholds are assumptions, not standards.
- No personal donor/recipient data, file contents, or real serial numbers in demo fixtures.
- Never expose secret/service-role Supabase credentials or `RESEND_API_KEY` to the browser.
- All real-data mutations require server-side Zod input validation, authentication, authorization, and transition checks.
- Make financial assumptions editable and clearly hypothetical; no fabricated case/impact claims.

## Coding conventions
- One domain type definition; one rules engine used by both demo and production.
- Shared presentational components; separate demo and production repository adapters.
- Explicit loading/empty/error states, accessible focus and labels, mobile-responsive UI.
- Prefer simple, testable solutions over dependencies or LLM integration.
- After each milestone, run and report relevant lint/typecheck/test/build commands.
- Do not add P1/P2 features until the P0 demonstration works end-to-end.

## Agent communication
- Start with a concise plan and the next smallest vertical slice.
- Never imply permissions or credentials exist; ask only where actual setup/authorization is required.
- Summarize edited files, actual tests run, current risks, and next step after each phase.
- Document remaining limitations and honest AI usage for Devpost.
