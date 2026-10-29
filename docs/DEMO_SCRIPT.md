# ReuseFlow Demo Recording Script — 7:20 Storyboard (Under 8:00 Cap)

**Published 2-Minute Product Demo Video:** [https://youtu.be/TsD79yBawuQ](https://youtu.be/TsD79yBawuQ)  

**Target total duration:** ~7 minutes 20 seconds (strictly under the 8:00 official limit).  
**Pre-recording requirement:** Ensure an eligible team member has verified [`docs/CASE_ALIGNMENT.md`](CASE_ALIGNMENT.md) against the official FUSE Society Blueprint 2026 case packet.

---

## 0:00–0:55 — 1. Organization Context & Case Challenge
- Introduce the team and the partner organization context using only permitted public facts and your team's short paraphrase of the specific case challenge.
- State clearly which operational metrics are verified from the case vs. which inputs are modeled as configurable hypotheses.

## 0:55–2:00 — 2. Root Cause, Alternatives Considered & Why ReuseFlow
- Explain why inconsistent manual intake and ad-hoc repair estimates create bottlenecks:
  1. Unclear repair labor/parts margin before bench time is spent.
  2. Safety risks (swollen lithium-ion batteries) and data-bearing storage media requiring strict human gates.
  3. Lack of an auditable trail from intake to disposition.
- Compare alternatives:
  - *Paper checklists:* No cost arithmetic, no searchable history, cannot enforce workflow gates.
  - *Shared spreadsheets:* Fragile under concurrent edits, no role-based approval guardrails, easy to overwrite history.
  - *ReuseFlow MVP:* Fast 90-second intake, deterministic rule engine `v1.0.0`, human manager approvals, and transparent scenario modeling.
- Sound bite: *"The system does not replace technicians; it standardizes decisions and records the reasons."*

## 2:00–4:35 — 3. Live Product Walkthrough (`/demo`)
1. **Landing & Sandbox Isolation (`/` -> `/demo`):**
   - Click **Try Interactive Demo**. Point out the **Fictional Sample Data** banner and explain that `/demo` runs entirely in browser-local state without touching production databases or sending emails.
2. **Create & Assess Viable Laptop (`Case A`):**
   - Click **New Device Intake**. Click **Quick-Load PRD Fixture: Case A** (or enter Lenovo ThinkPad T480, 8 GB RAM, boots, repairable, $20 parts, 45 min labor, $180 comparable value).
   - Click **Save Device & Run Assessment**.
   - Expand **Why this result?**: show `REFURBISH_CANDIDATE`, rule `VIABLE_COST_AND_FUNCTION`, $20 parts + $15 labor = $35 repair cost, $180 comparable value, and **+$145.00 net margin**.
   - Open the **What-If Parts Cost Simulator** and change parts cost to $170 to show how the engine recalculates without overwriting the saved assessment snapshot.
3. **Human Manager Approval & Audit Trail:**
   - Under **Human Workflow Review & Gate Controls**, select **Approve for Refurbishment (`approved_refurb`)**, enter an audit note, and click **Approve**. Show the new immutable event in the **Append-Only Workflow Audit Timeline**.
   - Switch **Simulate Role** in the top bar to `Technician` or `Viewer` to demonstrate that unauthorized roles are blocked from manager approvals.
4. **Safety Quarantine, Missing Input Recovery & Sanitization Gate (`Case C`, `Case E` & `Case F`):**
   - Select `FG-DEMO-103` (`Case C — Swollen Battery`). Highlight the amber **Safety Quarantine Active** alert and explain that swollen batteries trigger `QUARANTINE` *before* any economic scoring.
   - Select `FG-DEMO-105` (`Case E — Missing Comparable Value`). Click **Complete Missing Intake Specs**, enter `$140.00`, and click **Save Specs & Re-Evaluate v1.0.0** to watch it transition live from `INSUFFICIENT_DATA` (`intake`) to `REFURBISH_CANDIDATE` (`assessed`).
   - Select `FG-DEMO-106` (`Case F — Pending Sanitization`). Show that while it is economically a `REFURBISH_CANDIDATE`, the **Ready / Disposition Sanitization Gate** blocks moving to `ready` until a manager records external sanitization verification.

## 4:35–5:50 — 4. Scenario Lab, Strategic Alternatives & Financial Assumptions
- Click **Scenario Lab**.
- Show the default seed calculation: 100 devices/month, 12 min manual baseline vs. 6 min structured target, $20/hour labor rate -> **10 hours/month** and **$200.00/month** in hypothetical bench capacity value.
- Adjust the **Monthly Device Volume** slider to 200 devices/month and add realistic one-time implementation ($1,200) and monthly hosting ($40) costs to show the live payback calculation.
- Point to the **Strategic Alternatives Analysis — Refurbishment Triage Operating Model** matrix comparing Status Quo Spreadsheets vs. ReuseFlow v1.0.0 vs. Heavy Custom ERP.
- Sound bite: *"Every dollar of impact is traceable to an editable assumption—not an invented operational metric."*

## 5:50–6:50 — 5. Technical Architecture, Live Supabase `/app` & Rollout Risks
- Highlight the production `/app` architecture (`https://reuseflow.vercel.app/login`):
  - One-Click Hackathon Demo Login (`Manager`, `Technician`, `Viewer`) backed by live Supabase Postgres (`https://reuseflow-sb.propixer.in`) with Row-Level Security (`anon` revoked, `viewer` read-only, `technician` intake-only, `manager` transactional RPC transitions), Staff Profile Management, and Admin Governance Panel.
  - Append-only database triggers protecting `assessments` and `workflow_events`.
  - Optional P1 manager-triggered Resend operational summary with recipient allowlist and zero PII (show the non-sending **Preview Summary Content** in `/demo`).

## 6:50–7:20 — 6. Pilot Recommendation & Close
- Propose a concrete 4-week single-bench pilot (100 devices) measuring actual intake time saved, triage consistency, and zero unverified storage closures.
- Sound bite: *"This is a working vertical slice with safe demo data, real persistence, human approvals, and auditable results."*
