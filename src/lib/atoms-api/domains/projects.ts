import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Project, ProjectMember } from '@/lib/atoms-api/domains/types';
import { normalizeError } from '@/lib/atoms-api/errors';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createProjectsDomain(supabase: SupabaseAny) {
  return {
    async getById(id: string): Promise<Project | null> {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    },

    async listForUser(userId: string, orgId: string): Promise<Project[]> {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, project_members!inner(project_id)`) // inner join on membership
        .eq('project_members.user_id', userId)
        .eq('project_members.org_id', orgId)
        .eq('project_members.status', 'active')
        .eq('is_deleted', false);
      if (error) throw error;
      return (data as Project[]) ?? [];
    },

    async listMembers(projectId: string): Promise<ProjectMember[]> {
      const { data, error } = await supabase
        .from('project_members')
        .select('*, profiles(*)')
        .eq('project_id', projectId)
        .eq('status', 'active');
      if (error) throw error;
      return (data as unknown as ProjectMember[]) ?? [];
    },

    async listByOrg(organizationId: string): Promise<Project[]> {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Project[]) ?? [];
    },

    async listByMembershipForOrg(orgId: string, userId: string): Promise<Project[]> {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('status', 'active');
      if (error) throw error;
      const ids = (data ?? []).map((m) => m.project_id);
      if (!ids.length) return [];
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('id', ids)
        .eq('organization_id', orgId)
        .eq('is_deleted', false);
      if (projectError) throw projectError;
      return (projects as Project[]) ?? [];
    },

    async listWithFilters(filters?: Record<string, unknown>): Promise<Project[]> {
      let query = supabase.from('projects').select('*');
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v !== undefined) {
            query = query.eq(k as string, v as unknown as string | number | boolean | null);
          }
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as Project[]) ?? [];
    },

    async create(insert: Partial<Project>): Promise<Project> {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert(insert)
          .select()
          .single();
        if (error) throw error;
        return data as Project;
      } catch (e) {
        throw normalizeError(e, 'Failed to create project');
      }
    },

    async update(id: string, updates: Partial<Project>): Promise<Project> {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Project;
      } catch (e) {
        throw normalizeError(e, 'Failed to update project');
      }
    },

    async softDelete(id: string, userId: string): Promise<Project> {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Project;
      } catch (e) {
        throw normalizeError(e, 'Failed to delete project');
      }
    },

    async addMember(projectId: string, userId: string, role: string, orgId: string) {
      try {
        const { data, error } = await supabase
          .from('project_members')
          .insert({ user_id: userId, project_id: projectId, role, org_id: orgId, status: 'active' })
          .select()
          .single();
        if (error) throw error;
        return data as unknown as ProjectMember;
      } catch (e) {
        throw normalizeError(e, 'Failed to add project member');
      }
    },

    async setMemberRole(projectId: string, userId: string, role: string) {
      const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId);
      if (error) throw error;
      return { projectId, userId, role };
    },

    async removeMember(projectId: string, userId: string) {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
      if (error) throw error;
      return { projectId, userId };
    },
  };
}

export type ProjectsDomain = ReturnType<typeof createProjectsDomain>;
