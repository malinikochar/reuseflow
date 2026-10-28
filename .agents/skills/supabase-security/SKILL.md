---
name: supabase-security
description: Implements secure Supabase Postgres schema and migrations, SSR authentication, row-level security, role-safe server actions, append-only assessments and workflow audit transitions. Use when implementing persistence, auth and authorization.
---

# Supabase security skill

## Procedure
1. Read PRD §§7–9 and current official Supabase SSR and RLS docs. Check Next.js version (`proxy.ts` for v16+; older versions may require `middleware.ts`).
2. Create SQL migrations, enums, FKs, nonnegative constraints, timestamps, indices and audited tables.
3. Use `@supabase/ssr` for cookie-based auth. Verify server identity and trusted role; **do not authorize from user-controlled input or `getSession().user` alone**.
4. Enable RLS and restrictive grants on each exposed table. `anon`: no production data. `viewer`: read. `technician`: intake creation/allowed edits. `manager`: audited transition and verification.
5. Prohibit self-role escalation, assessment/history rewrites, and direct unaudited final-state updates.
6. Use server-side transactional status transition with expected-current-state conflict check and append-only event in the same operation.
7. Block data-bearing records moving to `ready`/`closed` until manager-verified sanitization is recorded; this is a record of an external step, not a wipe certificate.
8. Keep privileged database keys server-only. Do not expose service-role credentials in Next.js client code. Avoid recursive RLS or unsafe security-definer functions.
9. Write allow/deny RLS tests for anonymous, viewer, technician and manager; verify real `/app` persistence and a denied privilege escalation attempt.

## Completion evidence
Migration files committed; authenticated device survives reload; unauthorized actions fail; workflow events match actual transitions; tests and residual risks recorded honestly.
