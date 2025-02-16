import { supabase } from '@/lib/supabase/supabaseBrowser';
import { ProjectSchema } from '@/types/validation/projects.validation';

export const getProjectBySlug = async (slug: string) => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) throw error;
    return data;
};

export const getUserProjects = async (userId: string, orgId: string) => {
    const { data: projectMemberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'active');

    if (memberError) throw memberError;

    const projectIds = projectMemberData.map((pm) => pm.project_id);

    const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_deleted', false)
        .in('id', projectIds);

    if (error) throw error;

    const parsedProjects = projectData.map((project) =>
        ProjectSchema.parse(project),
    );

    return parsedProjects;
};

export const getProjectMembers = async (projectId: string) => {
    const { data, error } = await supabase
        .from('project_members')
        .select('*, profiles(*)')
        .eq('project_id', projectId)
        .eq('status', 'active');

    if (error) throw error;
    return data;
};
