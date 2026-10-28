import { NextRequest, NextResponse } from 'next/server';
import {
  DeviceResearchInputSchema,
  runDeviceResearch,
} from '@/lib/research/device-research-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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
