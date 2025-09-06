import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createRecentDomain(supabase: SupabaseAny) {
  return {
    async documentsByOrgIds(orgIds: string[]) {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          description,
          updated_at,
          project_id,
          projects!inner (
              id,
              name,
              organization_id,
              organizations!inner (
                  id,
                  name
              )
          )
        `)
        .in('projects.organization_id', orgIds)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    async projectsByOrgIds(orgIds: string[]) {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          updated_at,
          organization_id,
          organizations!inner (
              id,
              name
          )
        `)
        .in('organization_id', orgIds)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    async requirementsByOrgIds(orgIds: string[]) {
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          id,
          name,
          description,
          external_id,
          updated_at,
          document_id,
          documents!inner (
              id,
              name,
              project_id,
              projects!inner (
                  id,
                  name,
                  organization_id,
                  organizations!inner (
                      id,
                      name
                  )
              )
          )
        `)
        .in('documents.projects.organization_id', orgIds)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  };
}

export type RecentDomain = ReturnType<typeof createRecentDomain>;
