---
name: product-ux
description: Designs and implements ReuseFlow's polished accessible mobile-responsive intake, inventory, assessment explanations, dashboard, Scenario Lab, and judge-facing interactive demo. Use for Next.js UI implementation and usability review.
---

# Product UX skill

## Goal
A hackathon judge should understand and operate the full product in ~90 seconds, with no broken links, fake buttons, or mandatory sign-in.

## Procedure
1. Read PRD sections 4–5, especially Journey A and visual direction.
2. Design for a professional operations SaaS: high contrast, clear hierarchy, responsive navigation, restrained teal accent and purposeful safety colors.
3. Create reusable components shared by `/demo` and `/app`; no copied parallel UI.
4. Make P0 controls functional: intake form, inventory search/filter, assess, expand reasons, manager-review simulation, timeline, Scenario Lab, Reset Demo.
5. Use semantic markup, visible labels, keyboard focus, dialogs that can be closed by keyboard, inline errors, empty/loading/error states.
6. Always mark public content `Fictional Sample Data` and assessment outputs `Human approval required`.
7. Show a separate safety alert for quarantine, and separate data-sanitization status.
8. Test at 375px, 768px, and 1440px widths, plus a full keyboard walkthrough.

## Acceptance
A guest can complete `open -> intake -> assess -> explain -> approve -> impact -> reset` in a coherent demo. All financial figures must recompute from real state and labeled assumptions.
