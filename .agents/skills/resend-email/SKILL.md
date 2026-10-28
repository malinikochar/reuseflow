---
name: resend-email
description: Adds manager-triggered operational-summary email using the Resend SDK in secure Next.js server code with verified sender, recipient allowlist and isolated demo preview. Use only after core MVP and security gates pass.
---

# Resend email skill — optional P1

## Precondition
P0 demonstration, production build and auth checks must work first. Confirm verified sender domain and server-side `RESEND_API_KEY`; otherwise implement preview-only fallback.

## Procedure
1. Use current official Resend Next.js SDK guidance, instantiated only in a server module.
2. Provide manager-only manual `Send summary` action; never send without an explicit click and approved recipient.
3. Authorize on server; validate recipient against `REPORT_RECIPIENT_ALLOWLIST`, use rate limiting and an idempotency key to avoid duplicate sends.
4. Send aggregate metrics and link only; no donor identities, recipient details, serial numbers, private attachments or secret values.
5. Save a minimal email-event log with status and provider ID. Handle provider errors gracefully.
6. Public `/demo` renders a non-sending preview prominently saying `No email is sent`.
7. If unconfigured, show `Email notifications not configured` without breaking device assessment.

## Tests
Unauthenticated and non-manager rejected; unapproved recipient rejected; duplicate send suppressed; absent API key handled; browser sandbox never calls real send. Never test on real addresses without permission.
