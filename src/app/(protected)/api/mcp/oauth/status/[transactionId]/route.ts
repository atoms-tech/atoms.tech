import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';

const ATOMSAGENT_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

interface RouteParams {
  params: Promise<{ transactionId: string }>;
}

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await getOrCreateProfileForWorkOSUser(user);

    const { transactionId } = await params;

    const response = await fetch(
      `${ATOMSAGENT_URL}/atoms/oauth/status/${encodeURIComponent(transactionId)}`,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      logger.error('atomsAgent OAuth status failed', errorPayload, {
        status: response.status,
      });
      return NextResponse.json(
        { error: 'Failed to fetch OAuth status', details: errorPayload },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json({ transaction: data });
  } catch (error) {
    logger.error('OAuth status API error', error, {
      route: '/api/mcp/oauth/status/[transactionId]',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
