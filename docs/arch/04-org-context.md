# Organization Context and Providers

## Core Organization Context

### 1. Organization Context Definition

```typescript
// contexts/organization/types.ts
export interface OrganizationState {
    organization: Organization | null;
    permissions: OrgPermissions | null;
    members: OrgMember[];
    settings: OrgSettings;
    status: 'loading' | 'active' | 'error';
    error: Error | null;
}

export interface OrgContextValue extends OrganizationState {
    // Actions
    updateOrganization: (updates: Partial<Organization>) => Promise<void>;
    updateSettings: (updates: Partial<OrgSettings>) => Promise<void>;
    inviteMember: (email: string, role: OrgRole) => Promise<void>;
    removeMember: (userId: string) => Promise<void>;
    // Selectors
    canAccess: (permission: OrgPermission) => boolean;
    getMemberRole: (userId: string) => OrgRole | null;
    // Utils
    refresh: () => Promise<void>;
}

// contexts/organization/context.tsx
export const OrganizationContext = createContext<OrgContextValue>(null!);

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error(
            'useOrganization must be used within OrganizationProvider',
        );
    }
    return context;
}
```

### 2. Organization Provider Implementation

```typescript
// contexts/organization/provider.tsx
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth';

export function OrganizationProvider({
  orgSlug,
  initialData,
  children
}: {
  orgSlug: string;
  initialData?: OrganizationState;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch organization data
  const { data: organization, status } = useQuery({
    queryKey: ['org', orgSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      if (error) throw error;
      return data;
    },
    initialData: initialData?.organization ?? undefined
  });

  // Fetch organization permissions
  const { data: permissions } = useQuery({
    queryKey: ['org', orgSlug, 'permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('role, permissions')
        .eq('organization_slug', orgSlug)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    initialData: initialData?.permissions ?? undefined
  });

  // Actions
  const updateOrganization = async (updates: Partial<Organization>) => {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organization?.id);

    if (error) throw error;

    // Invalidate queries
    queryClient.invalidateQueries(['org', orgSlug]);
  };

  const updateSettings = async (updates: Partial<OrgSettings>) => {
    const { error } = await supabase
      .from('organizations')
      .update({ settings: { ...organization?.settings, ...updates } })
      .eq('id', organization?.id);

    if (error) throw error;

    queryClient.invalidateQueries(['org', orgSlug]);
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(`org-${organization.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organizations',
        filter: `id=eq.${organization.id}`
      }, (payload) => {
        queryClient.invalidateQueries(['org', orgSlug]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, orgSlug, queryClient, supabase]);

  // Context value
  const value: OrgContextValue = {
    organization,
    permissions,
    status,
    error: null,
    updateOrganization,
    updateSettings,
    canAccess: (permission) => hasPermission(permissions, permission),
    getMemberRole: (userId) => getMemberRole(permissions, userId),
    refresh: () => queryClient.invalidateQueries(['org', orgSlug])
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
```

## Feature-Specific Providers

### 1. Organization Members Provider

```typescript
// contexts/organization/members-provider.tsx
'use client';

export function OrgMembersProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { organization } = useOrganization();
    const queryClient = useQueryClient();

    // Fetch members
    const { data: members } = useQuery({
        queryKey: ['org', organization?.slug, 'members'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('organization_members')
                .select(
                    `
          user_id,
          role,
          permissions,
          profiles (id, full_name, avatar_url)
        `,
                )
                .eq('organization_id', organization?.id);

            if (error) throw error;
            return data;
        },
        enabled: !!organization?.id,
    });

    // Member management
    const inviteMember = async (email: string, role: string) => {
        const { error } = await supabase.from('organization_invites').insert({
            organization_id: organization?.id,
            email,
            role,
        });

        if (error) throw error;
    };

    const removeMember = async (userId: string) => {
        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('organization_id', organization?.id)
            .eq('user_id', userId);

        if (error) throw error;
    };

    // Real-time updates
    useEffect(() => {
        if (!organization?.id) return;

        const channel = supabase
            .channel(`org-members-${organization.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'organization_members',
                    filter: `organization_id=eq.${organization.id}`,
                },
                (payload) => {
                    queryClient.invalidateQueries([
                        'org',
                        organization.slug,
                        'members',
                    ]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [organization?.id]);

    return children;
}
```

### 2. Organization Activity Provider

```typescript
// contexts/organization/activity-provider.tsx
'use client';

export function OrgActivityProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { organization } = useOrganization();
    const queryClient = useQueryClient();

    // Fetch activity
    const { data: activity } = useQuery({
        queryKey: ['org', organization?.slug, 'activity'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('organization_id', organization?.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        },
        enabled: !!organization?.id,
    });

    // Real-time updates
    useEffect(() => {
        if (!organization?.id) return;

        const channel = supabase
            .channel(`org-activity-${organization.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'audit_logs',
                    filter: `organization_id=eq.${organization.id}`,
                },
                (payload) => {
                    queryClient.invalidateQueries([
                        'org',
                        organization.slug,
                        'activity',
                    ]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [organization?.id]);

    return children;
}
```

## Organization Hooks

### 1. Permission Hooks

```typescript
// hooks/useOrgPermissions.ts
export function useOrgPermissions() {
    const { permissions, canAccess } = useOrganization();

    return {
        permissions,
        canAccess,
        isAdmin: canAccess('admin'),
        isOwner: canAccess('owner'),
        isMember: canAccess('member'),
    };
}
```

### 2. Organization Settings Hooks

```typescript
// hooks/useOrgSettings.ts
export function useOrgSettings() {
    const { organization, updateSettings } = useOrganization();

    const setSetting = async <T>(key: string, value: T) => {
        await updateSettings({ [key]: value });
    };

    const getSetting = <T>(key: string, defaultValue: T): T => {
        return organization?.settings?.[key] ?? defaultValue;
    };

    return {
        settings: organization?.settings ?? {},
        setSetting,
        getSetting,
    };
}
```

## Integration with App Router

### 1. Organization Layout

```typescript
// app/org/[orgSlug]/layout.tsx
import { Suspense } from 'react';
import { OrganizationProvider } from '@/contexts/organization';

export default async function OrganizationLayout({
  params,
  children
}: {
  params: { orgSlug: string };
  children: React.ReactNode;
}) {
  // Fetch initial data server-side
  const initialData = await fetchInitialOrgData(params.orgSlug);

  return (
    <Suspense fallback={<OrgLoadingSkeleton />}>
      <OrganizationProvider
        orgSlug={params.orgSlug}
        initialData={initialData}
      >
        <OrgMembersProvider>
          <OrgActivityProvider>
            <OrgNavigation />
            {children}
          </OrgActivityProvider>
        </OrgMembersProvider>
      </OrganizationProvider>
    </Suspense>
  );
}
```

### 2. Initial Data Loading

```typescript
// lib/organization.ts
export async function fetchInitialOrgData(slug: string) {
    const supabase = createServerSupabaseClient();

    const [org, permissions] = await Promise.all([
        supabase
            .from('organizations')
            .select('*')
            .eq('slug', slug)
            .single()
            .then(({ data }) => data),

        supabase
            .from('organization_members')
            .select('role, permissions')
            .eq('organization_slug', slug)
            .eq('user_id', user?.id)
            .single()
            .then(({ data }) => data),
    ]);

    return {
        organization: org,
        permissions,
        status: 'active' as const,
        error: null,
    };
}
```

## Best Practices

1. **Data Management**

    - Server-side initial data loading
    - Client-side real-time updates
    - Optimistic updates for better UX

2. **Performance**

    - Selective re-renders with context splitting
    - Efficient real-time subscriptions
    - Query invalidation strategies

3. **Error Handling**

    - Graceful error states
    - Fallback UI components
    - Error boundaries integration

4. **Type Safety**
    - Strong typing for context values
    - Runtime validation with Zod
    - Complete type coverage
