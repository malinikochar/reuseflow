# ReuseFlow — Antigravity workspace starter pack

This ZIP is a **specification and agent-skills starter**, **not a prebuilt application**.

## First run
1. Create a new empty GitHub repo and open it as an Antigravity workspace.
2. Extract these files into the **repository root**, including the hidden `.agents/` directory.
3. In Antigravity, select **Gemini 4 Argon** (High reasoning is helpful for architecture).
4. Read `ReuseFlow_PRD.md` and, as an eligible participant, validate the case using the official packet. Fill in `docs/CASE_ALIGNMENT.md` without redistributing any restricted case text.
5. Paste the prompt from `ANTIGRAVITY_MASTER_PROMPT.md`. Ask the agent to start **Phase 1 (domain + tests)**, then move to `/demo`, Supabase and optional email.
6. Set up your Supabase project, verify a Resend sender domain if using P1, push to GitHub and deploy with Vercel after relevant tests pass.
7. Record and submit all three required hackathon components; Devpost alone is not a submission.

## Included
- `ReuseFlow_PRD.md` — requirements, rules, data model, acceptance tests, stages, master prompt.
- `ANTIGRAVITY_MASTER_PROMPT.md` — easy-to-copy standalone build prompt.
- `AGENTS.md` — always-active coding and safety rules.
- `.agents/skills/*/SKILL.md` — seven workspace skills with valid frontmatter.
- `docs/CASE_ALIGNMENT.md`, `docs/DEMO_SCRIPT.md`, `docs/AI_DISCLOSURE.md` — working templates.
- `.env.example` — environment variable names, no secrets.

**Important:** The official case packet contents are not bundled/verified. Case specificity must be checked before final pitch. All cost/impact samples are fictional.
