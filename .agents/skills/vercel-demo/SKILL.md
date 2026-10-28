---
name: vercel-demo
description: Prepares ReuseFlow's GitHub/Vercel release, environment variables, browser-accessible demo, README, short presentation and FUSE Society Blueprint 2026 submission checklist. Use before deploy, demo recording or judging handoff.
---

# Vercel and judging demo skill

## Release
1. Verify GitHub source, `.gitignore`, no `.env.local`, no credentials, and coherent commits.
2. Run and report lint, typecheck, unit tests, production build and public sandbox smoke flow.
3. Connect repo to Vercel. Configure public Supabase URL/publishable key and all secrets in appropriate Vercel environment scopes, not Git. Redeploy when env vars change.
4. Configure Supabase Auth redirect URLs for the actual Vercel domain for authenticated `/app`.
5. Test public `/demo` without login in a private browser; it must remain isolated and usable even when backend unavailable.
6. Test device creation/assessment/approval/dashboard on desktop and 375px mobile; verify shareable URLs.
7. Complete README, case limitations, `docs/DEMO_SCRIPT.md`, `docs/AI_DISCLOSURE.md`.

## Hackathon submission
Official deadline Oct 31, 2026, 12:00 AM EDT / 9:30 AM IST. Required: **published** Devpost page (business problem, solution, costs/timeline, team/artifact), **Unlisted** <=8-minute YouTube recording, and **official submission form**, including AI-use disclosure. Test links privately. Devpost page alone is not enough.

## Final report
Provide live URLs only if verified, tests actually run, known blockers, and checkbox status for each required submission component. Do not imply an automation, video upload, email, or submission happened unless it truly happened.
