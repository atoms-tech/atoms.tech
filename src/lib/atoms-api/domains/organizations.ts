import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Organization } from '@/lib/atoms-api/domains/types';
import type { Tables, TablesInsert } from '@/types/base/database.types';
import { normalizeError } from '@/lib/atoms-api/errors';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createOrganizationsDomain(supabase: SupabaseAny) {
  type OrgMemberWithProfile = Tables<'organization_members'> & { profiles: Tables<'profiles'> | null };
  return {
    async getById(orgId: string): Promise<Organization | null> {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .eq('is_deleted', false)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    },

    async getIdBySlug(slug: string): Promise<string | null> {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.id ?? null;
    },

    async listForUser(userId: string): Promise<Organization[]> {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organizations!inner(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('is_deleted', false);
      if (error) throw error;
      if (!data) return [];
      return (data as unknown as Array<{ organizations: Organization | null }>)
        .map((m) => m.organizations)
        .filter((o): o is Organization => Boolean(o));
    },

    async listIdsByMembership(userId: string): Promise<string[]> {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('is_deleted', false);
      if (error) throw error;
      return ((data ?? []) as Array<{ organization_id: string }>).map((m) => m.organization_id);
    },

    async listWithFilters(filters?: Record<string, unknown>) {
      let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_deleted', false);
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v !== undefined) {
            query = query.eq(
              k as string,
              v as unknown as string | number | boolean | null,
            );
          }
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as Organization[]) ?? [];
    },

    async getPersonalOrg(userId: string) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', userId)
        .eq('type', 'personal')
        .eq('is_deleted', false)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    },

    async create(insert: TablesInsert<'organizations'>) {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .insert(insert)
          .select('*')
          .single();
        if (error) throw error;
        return data as Organization;
      } catch (e) {
        throw normalizeError(e, 'Failed to create organization');
      }
    },

    async listMembers(organizationId: string): Promise<OrgMemberWithProfile[]> {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('*, profiles(*)')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .eq('is_deleted', false);
        if (error) throw error;
        return (data as unknown as OrgMemberWithProfile[]) ?? [];
      } catch (e) {
        throw normalizeError(e, 'Failed to list organization members');
      }
    },

    async removeMember(organizationId: string, userId: string) {
      try {
        const { error } = await supabase
          .from('organization_members')
          .delete()
          .eq('organization_id', organizationId)
          .eq('user_id', userId);
        if (error) throw error;
      } catch (e) {
        throw normalizeError(e, 'Failed to remove organization member');
      }
    },

    async invite(input: TablesInsert<'organization_invitations'>) {
      const { data, error } = await supabase
        .from('organization_invitations')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async addMember(input: TablesInsert<'organization_members'>) {
      const { data, error } = await supabase
        .from('organization_members')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async setMemberRole(orgId: string, userId: string, role: string) {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('organization_id', orgId)
        .eq('user_id', userId);
      if (error) throw error;
      return { orgId, userId, role };
    },

    async updateMemberCount(orgId: string): Promise<number> {
      const { count, error: countError } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      if (countError) throw countError;
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ member_count: count })
        .eq('id', orgId);
      if (updateError) throw updateError;
      return count ?? 0;
    },
  };
}

export type OrganizationsDomain = ReturnType<typeof createOrganizationsDomain>;
