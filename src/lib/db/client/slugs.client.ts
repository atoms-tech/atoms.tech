import type { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

export async function useEntitySlugs(
    client: SupabaseClient<Database>,
    params: {
        orgId?: string;
        projectId?: string;
        documentId?: string;
    },
) {
    const { orgId, projectId, documentId } = params;

    const slugs: { org?: string; project?: string; document?: string } = {};

    if (orgId) {
        const { data: org } = await client
            .from('organizations')
            .select('slug')
            .eq('id', orgId)
            .single();
        if (org) slugs.org = org.slug;
    }

    if (projectId) {
        const { data: project } = await client
            .from('projects')
            .select('slug')
            .eq('id', projectId)
            .single();
        if (project) slugs.project = project.slug;
    }

    if (documentId) {
        const { data: document } = await client
            .from('documents')
            .select('slug')
            .eq('id', documentId)
            .single();
        if (document) slugs.document = document.slug;
    }

    return slugs;
}
