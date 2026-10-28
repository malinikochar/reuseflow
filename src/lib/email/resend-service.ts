import { Resend } from 'resend';
import { ActionResponse, Device, UserRole } from '@/types/domain';
import { sendSummaryEmailSchema } from '@/lib/validation/schemas';
import { buildOperationalSummaryText } from '@/components/analytics/email-summary-card';

export type SendSummaryDeps = {
  actor: { id: string; name: string; role: UserRole } | null;
  resendApiKey?: string;
  fromEmail?: string;
  allowlistCsv?: string;
  siteUrl?: string;
  devices: Device[];
  sendFn?: (params: {
    from: string;
    to: string[];
    subject: string;
    text: string;
    headers: Record<string, string>;
  }) => Promise<{ data?: { id?: string } | null; error?: { message: string } | null }>;
};

const processedIdempotencyKeys = new Set<string>();
const lastSendByActorMs = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 10_000;

export function resetEmailRateLimitStateForTests() {
  processedIdempotencyKeys.clear();
  lastSendByActorMs.clear();
}

export async function sendOperationalSummaryServerOnly(
  rawInput: unknown,
  deps: SendSummaryDeps
): Promise<ActionResponse<{ providerId: string; recipient: string }>> {
  // 1. Verify authentication
  if (!deps.actor) {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required to send operational summary emails.',
    };
  }

  // 2. Verify manager role
  if (deps.actor.role !== 'manager') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Only an authorized Refurbishment Manager can trigger operational summary emails.',
    };
  }

  // 3. Validate payload with Zod
  const parsed = sendSummaryEmailSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: parsed.error.issues.map((i) => i.message).join(' '),
    };
  }

  const { recipient, idempotencyKey } = parsed.data;
  const normalizedRecipient = recipient.trim().toLowerCase();

  // 4. Check Resend configuration first so unconfigured environments degrade gracefully
  const apiKey = deps.resendApiKey?.trim() ?? '';
  const fromEmail = deps.fromEmail?.trim() ?? '';
  const allowlistRaw = deps.allowlistCsv?.trim() ?? '';

  if (!apiKey || !fromEmail) {
    return {
      ok: false,
      code: 'FAILED_DEPENDENCY',
      message:
        'Email notifications not configured (RESEND_API_KEY or RESEND_FROM_EMAIL is absent). Triage and assessment workflows remain unaffected.',
    };
  }

  // 5. Enforce recipient allowlist
  const allowlist = allowlistRaw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.includes(normalizedRecipient)) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: `Recipient '${normalizedRecipient}' is not in REPORT_RECIPIENT_ALLOWLIST.`,
    };
  }

  // 6. Idempotency check
  if (processedIdempotencyKeys.has(idempotencyKey)) {
    return {
      ok: false,
      code: 'CONFLICT',
      message: 'Duplicate summary email request suppressed by idempotency key.',
    };
  }

  // 7. Rate limit check per manager actor
  const now = Date.now();
  const prevSend = lastSendByActorMs.get(deps.actor.id);
  if (prevSend && now - prevSend < RATE_LIMIT_WINDOW_MS) {
    return {
      ok: false,
      code: 'CONFLICT',
      message: 'Rate limit active: please wait a few seconds before sending another summary email.',
    };
  }

  // 8. Build strictly aggregate summary payload (zero donor PII, zero serial numbers)
  const summary = buildOperationalSummaryText(deps.devices, false);
  const appUrl = deps.siteUrl?.trim() || 'http://localhost:3000';
  const fullText = `${summary.body}\n\nWorkspace Link: ${appUrl}/app`;

  try {
    const sender =
      deps.sendFn ??
      (async (payload) => {
        const resend = new Resend(apiKey);
        return resend.emails.send(payload);
      });

    const result = await sender({
      from: fromEmail,
      to: [normalizedRecipient],
      subject: summary.subject,
      text: fullText,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });

    if (result.error) {
      return {
        ok: false,
        code: 'FAILED_DEPENDENCY',
        message: `Email provider rejected send: ${result.error.message}`,
      };
    }

    processedIdempotencyKeys.add(idempotencyKey);
    lastSendByActorMs.set(deps.actor.id, now);

    return {
      ok: true,
      data: {
        providerId: result.data?.id ?? 'resend-queued',
        recipient: normalizedRecipient,
      },
    };
  } catch {
    return {
      ok: false,
      code: 'INTERNAL',
      message: 'Unexpected error while communicating with email provider.',
    };
  }
}
