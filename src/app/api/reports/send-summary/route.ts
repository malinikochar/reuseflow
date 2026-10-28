import { NextResponse } from 'next/server';
import { getVerifiedServerActor } from '@/lib/auth/session';
import { listDevicesServerAction } from '@/lib/actions/device-actions';
import { sendOperationalSummaryServerOnly } from '@/lib/email/resend-service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const auth = await getVerifiedServerActor();

    if (auth.status === 'unconfigured') {
      return NextResponse.json(
        {
          ok: false,
          code: 'FAILED_DEPENDENCY',
          message:
            'Email notifications not configured (Supabase/Resend server credentials absent).',
        },
        { status: 503 }
      );
    }

    if (auth.status === 'unauthenticated') {
      return NextResponse.json(
        {
          ok: false,
          code: 'UNAUTHORIZED',
          message: 'Authentication required to send operational summary emails.',
        },
        { status: 401 }
      );
    }

    const devicesRes = await listDevicesServerAction();
    const devices = devicesRes.ok ? devicesRes.data : [];

    const sendRes = await sendOperationalSummaryServerOnly(body, {
      actor: auth.actor,
      resendApiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'ReuseFlow <info@ensure.in>',
      allowlistCsv:
        process.env.REPORT_RECIPIENT_ALLOWLIST ||
        'info@ensure.in,admin@reuseflow.org,ops-manager@example.org',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://reuseflow.vercel.app',
      devices,
    });

    // Log email event in Supabase if configured and authenticated as manager
    if (auth.actor.role === 'manager') {
      const supabase = await createSupabaseServerClient();
      if (supabase && typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        const recipient = typeof b.recipient === 'string' ? b.recipient : 'unknown';
        const idempotencyKey =
          typeof b.idempotencyKey === 'string'
            ? b.idempotencyKey
            : `key-${Date.now()}`;

        await supabase.from('email_events').insert({
          type: 'operational_summary',
          recipient,
          provider_id: sendRes.ok ? sendRes.data.providerId : null,
          idempotency_key: idempotencyKey,
          status: sendRes.ok ? 'sent' : 'failed',
          sent_by: auth.actor.id,
        });
      }
    }

    const status = sendRes.ok
      ? 200
      : sendRes.code === 'UNAUTHORIZED'
        ? 401
        : sendRes.code === 'FORBIDDEN'
          ? 403
          : sendRes.code === 'CONFLICT'
            ? 409
            : sendRes.code === 'FAILED_DEPENDENCY'
              ? 503
              : 400;

    return NextResponse.json(sendRes, { status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'INTERNAL',
        message: 'Malformed summary email request.',
      },
      { status: 400 }
    );
  }
}
