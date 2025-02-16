import { supabase } from '@/lib/supabase/supabaseBrowser';

export async function useEntitySlugs(params: {
    orgId?: string;
    projectId?: string;
    documentId?: string;
}) {
    const { orgId, projectId, documentId } = params;

    const slugs: { org?: string; project?: string; document?: string } = {};

    if (orgId) {
        const { data: org } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', orgId)
            .single();
        if (org) slugs.org = org.slug;
    }

    if (projectId) {
        const { data: project } = await supabase
            .from('projects')
            .select('slug')
            .eq('id', projectId)
            .single();
        if (project) slugs.project = project.slug;
    }

    if (documentId) {
        const { data: document } = await supabase
            .from('documents')
            .select('slug')
            .eq('id', documentId)
            .single();
        if (document) slugs.document = document.slug;
    }

    return slugs;
} 