import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';

const ATOMSAGENT_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

export const dynamic = 'force-dynamic';

interface OAuthStartBody {
  providerKey: string;
  mcpNamespace: string;
  organizationId?: string;
  scopes?: string[];
  authMetadata?: Record<string, unknown> | null;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const profile = await getOrCreateProfileForWorkOSUser(user);
    if (!profile?.id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = (await request.json()) as OAuthStartBody;
    if (!body.providerKey || !body.mcpNamespace) {
      return NextResponse.json(
        { error: 'providerKey and mcpNamespace are required' },
        { status: 400 },
      );
    }

    const atomsResponse = await fetch(`${ATOMSAGENT_URL}/atoms/oauth/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_key: body.providerKey,
        mcp_namespace: body.mcpNamespace,
        user_id: profile.id,
        organization_id: body.organizationId ?? null,
        scopes: body.scopes ?? null,
        auth_metadata: body.authMetadata ?? null,
      }),
    });

    if (!atomsResponse.ok) {
      const errorPayload = await atomsResponse.json().catch(() => ({}));
      logger.error('atomsAgent OAuth start failed', errorPayload, {
        status: atomsResponse.status,
      });
      return NextResponse.json(
        { error: 'Failed to start OAuth flow', details: errorPayload },
        { status: atomsResponse.status === 400 ? 400 : 502 },
      );
    }

    const data = await atomsResponse.json();
    return NextResponse.json({ transaction: data });
  } catch (error) {
    logger.error('OAuth start API error', error, { route: '/api/mcp/oauth/start' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
