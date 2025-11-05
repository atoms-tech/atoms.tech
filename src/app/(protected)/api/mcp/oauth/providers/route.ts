import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';

const ATOMSAGENT_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await getOrCreateProfileForWorkOSUser(user);

    const response = await fetch(`${ATOMSAGENT_URL}/atoms/oauth/providers`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const fallback = await response.text();
      logger.error('Failed to fetch OAuth providers from atomsAgent', fallback, {
        status: response.status,
      });
      return NextResponse.json(
        { error: 'Failed to fetch OAuth providers' },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json({ providers: data });
  } catch (error) {
    logger.error('OAuth providers API error', error, {
      route: '/api/mcp/oauth/providers',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
