import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Tables } from '@/types/base/database.types';
import { normalizeError } from '@/lib/atoms-api/errors';

export type Property = Tables<'properties'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createPropertiesDomain(supabase: SupabaseAny) {
  return {
    async getById(id: string): Promise<Property | null> {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      if (error && (error as unknown as { code?: string }).code !== 'PGRST116') throw error;
      return (data as Property) ?? null;
    },
    async listByOrg(orgId: string): Promise<Property[]> {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('org_id', orgId)
        .order('name');
      if (error) throw error;
      return (data as Property[]) ?? [];
    },

    async listByDocument(documentId: string): Promise<Property[]> {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('document_id', documentId)
        .order('name');
      if (error) throw error;
      return (data as Property[]) ?? [];
    },

    async listOrgBase(orgId: string): Promise<Property[]> {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_base', true)
        .is('document_id', null)
        .is('project_id', null);
      if (error) throw error;
      return (data as Property[]) ?? [];
    },

    async createMany(props: Partial<Property>[]): Promise<Property[]> {
      try {
        const { data, error } = await supabase
          .from('properties')
          .insert(props)
          .select();
        if (error) throw error;
        return (data as Property[]) ?? [];
      } catch (e) {
        throw normalizeError(e, 'Failed to create properties');
      }
    },

    async update(id: string, updates: Partial<Property>): Promise<Property> {
      try {
        const { data, error } = await supabase
          .from('properties')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data as Property;
      } catch (e) {
        throw normalizeError(e, 'Failed to update property');
      }
    },

    async softDelete(id: string, userId: string): Promise<void> {
      try {
        const { error } = await supabase
          .from('properties')
          .update({ is_deleted: true, deleted_by: userId, deleted_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } catch (e) {
        throw normalizeError(e, 'Failed to delete property');
      }
    },

    async updatePositions(updates: { id: string; position: number; updated_by: string }[]): Promise<void> {
      try {
        await Promise.all(
          updates.map(u => supabase
            .from('properties')
            .update({ position: u.position, updated_by: u.updated_by, updated_at: new Date().toISOString() })
            .eq('id', u.id),
          ),
        );
      } catch (e) {
        throw normalizeError(e, 'Failed to update property positions');
      }
    },
  };
}

export type PropertiesDomain = ReturnType<typeof createPropertiesDomain>;
