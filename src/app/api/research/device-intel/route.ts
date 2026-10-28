import { NextRequest, NextResponse } from 'next/server';
import {
  DeviceResearchInputSchema,
  runDeviceResearch,
} from '@/lib/research/device-research-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const clientRequestLog = new Map<string, number[]>();

function checkResearchRateLimit(clientKey: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (clientRequestLog.get(clientKey) ?? []).filter(
    (timestamp) => timestamp > windowStart
  );

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000)
    );
    clientRequestLog.set(clientKey, recent);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  recent.push(now);
  clientRequestLog.set(clientKey, recent);
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - recent.length),
    retryAfterSeconds: 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || 'anonymous-client';
    const rate = checkResearchRateLimit(clientIp);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded for live bench research. Please wait ${rate.retryAfterSeconds}s before running another query.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rate.retryAfterSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await request.json();
    const parsed = DeviceResearchInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid research request payload',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const brief = await runDeviceResearch(parsed.data);
    return NextResponse.json(brief, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute bench research',
      },
      { status: 500 }
    );
  }
}
