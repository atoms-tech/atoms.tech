/**
 * MCP Marketplace Page
 *
 * Public marketplace for browsing and installing MCP servers
 * Route: /marketplace
 */

import { Metadata } from 'next';
import { MarketplaceTabs } from '@/components/mcp/MarketplaceTabs';
import { createClient } from '@/lib/supabase/supabaseServer';
import { logger } from '@/lib/utils/logger';

export const metadata: Metadata = {
  title: 'MCP Marketplace | Atoms',
  description: 'Browse and install Model Context Protocol servers',
};

async function getOrganizations(userId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization:organizations(id, name)')
      .eq('user_id', userId);

    if (error) throw error;

    return (
      data
        ?.map((item) => item.organization)
        .filter(Boolean)
        .map((org: { id: string; name: string }) => ({
          id: org.id,
          name: org.name,
        })) || []
    );
  } catch (error) {
    logger.error('Error fetching organizations', error, {
      route: '/marketplace',
      userId,
    });
    return [];
  }
}

async function getInstalledServers(userId: string) {
  try {
    const supabase = await createClient();
    // Use type assertion since mcp_servers table might not be in generated types yet
    const { data, error } = await (supabase as any)
      .from('mcp_servers')
      .select('namespace')
      .eq('user_id', userId)
      .eq('enabled', true);

    if (error) throw error;

    return data?.map((server: { namespace: string }) => server.namespace) || [];
  } catch (error) {
    logger.error('Error fetching installed servers', error, {
      route: '/marketplace',
      userId,
    });
    return [];
  }
}

export default async function MarketplacePage() {
  // Get session on server side
  let organizations: Array<{ id: string; name: string }> = [];
  let installedServers: string[] = [];

  try {
    // Fetch session from API
    const sessionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/session`,
      {
        cache: 'no-store',
      }
    );

    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      const userId = session.user?.id;

      if (userId) {
        // Fetch user's organizations and installed servers in parallel
        [organizations, installedServers] = await Promise.all([
          getOrganizations(userId),
          getInstalledServers(userId),
        ]);
      }
    }
  } catch (error) {
    logger.error('Error fetching marketplace data', error, { route: '/marketplace' });
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <MarketplaceTabs
        organizations={organizations}
        installedServers={installedServers}
      />
    </div>
  );
}
