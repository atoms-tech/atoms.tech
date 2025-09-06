import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import { normalizeError } from '@/lib/atoms-api/errors';
import type { Tables } from '@/types/base/database.types';

import { createStorageDomain } from './storage';

export type ExternalDocument = Tables<'external_documents'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createExternalDocumentsDomain(supabase: SupabaseAny) {
    const storage = createStorageDomain();
    return {
        async getById(id: string): Promise<ExternalDocument | null> {
            const { data, error } = await supabase
                .from('external_documents')
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return (data as ExternalDocument) ?? null;
        },

        async listByOrg(orgId: string): Promise<ExternalDocument[]> {
            const { data, error } = await supabase
                .from('external_documents')
                .select('*')
                .eq('organization_id', orgId);
            if (error) throw error;
            return (data as ExternalDocument[]) ?? [];
        },

        async upload(file: File, orgId: string): Promise<ExternalDocument> {
            // In browser, call server route to perform storage ops
            if (typeof window !== 'undefined') {
                const form = new FormData();
                form.append('file', file);
                form.append('orgId', orgId);
                const res = await fetch('/api/external-documents/upload', {
                    method: 'POST',
                    body: form,
                });
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw normalizeError(
                        new Error(j.error || 'Upload failed'),
                        'Failed to upload external document',
                    );
                }
                return (await res.json()) as ExternalDocument;
            }

            // Server-side: perform direct storage + DB operations
            const { data: document, error: documentError } = await supabase
                .from('external_documents')
                .insert({
                    name: file.name,
                    type: file.type,
                    organization_id: orgId,
                    size: (file as unknown as { size?: number }).size ?? null,
                })
                .select('*')
                .single();
            if (documentError)
                throw normalizeError(
                    documentError,
                    'Failed to create external document record',
                );

            const filePath = `${orgId}/${document.id}`;
            const { error: storageError } = await supabase.storage
                .from('external_documents')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });
            if (storageError) {
                await supabase.from('external_documents').delete().eq('id', document.id);
                throw normalizeError(storageError, 'Failed to upload external document');
            }
            return document as ExternalDocument;
        },

        async remove(documentId: string): Promise<void> {
            if (typeof window !== 'undefined') {
                const res = await fetch(
                    `/api/external-documents/delete?id=${encodeURIComponent(documentId)}`,
                    { method: 'DELETE' },
                );
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}));
                    throw normalizeError(
                        new Error(j.error || 'Delete failed'),
                        'Failed to delete external document',
                    );
                }
                return;
            }

            const { data: document, error: fetchError } = await supabase
                .from('external_documents')
                .select('id, organization_id')
                .eq('id', documentId)
                .single();
            if (fetchError)
                throw normalizeError(fetchError, 'Failed to fetch external document');
            const filePath = `${(document as { organization_id: string; id: string }).organization_id}/${(document as { organization_id: string; id: string }).id}`;
            const { error: storageError } = await supabase.storage
                .from('external_documents')
                .remove([filePath]);
            if (storageError)
                throw normalizeError(
                    storageError,
                    'Failed to remove external document from storage',
                );
            const { error } = await supabase
                .from('external_documents')
                .delete()
                .eq('id', documentId);
            if (error) throw normalizeError(error, 'Failed to delete external document');
        },

        async update(
            documentId: string,
            data: Partial<ExternalDocument>,
        ): Promise<ExternalDocument> {
            const { data: updated, error } = await supabase
                .from('external_documents')
                .update(data)
                .eq('id', documentId)
                .select()
                .single();
            if (error) throw normalizeError(error, 'Failed to update external document');
            return updated as ExternalDocument;
        },

        getPublicUrl(orgId: string, documentId: string): string | null {
            const filePath = `${orgId}/${documentId}`;
            return storage.getPublicUrl('external_documents', filePath);
        },
    };
}

export type ExternalDocumentsDomain = ReturnType<typeof createExternalDocumentsDomain>;
