import { createClient } from '@/lib/supabase/supabaseServer';

export const getProjectByIdServer = async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const getUserProjectsServer = async (userId: string, orgId: string) => {
    try {
        const supabase = await createClient();
        const { data: projectData, error } = await supabase
            .from('projects')
            .select(
                `
                *,
                project_members!inner(project_id)
            `,
            )
            .eq('project_members.user_id', userId)
            .eq('project_members.org_id', orgId)
            .eq('project_members.status', 'active')
            .eq('is_deleted', false);

        if (error) {
            console.error('Database error in getUserProjectsServer:', {
                error,
                userId,
                orgId,
                errorMessage: error.message,
                errorCode: error.code,
            });
            throw error;
        }

        return projectData || [];
    } catch (error) {
        // Re-throw with additional context
        if (error instanceof Error) {
            error.message = `Failed to fetch projects for user ${userId} in org ${orgId}: ${error.message}`;
        }
        throw error;
    }
};

export const getProjectMembersServer = async (projectId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('project_members')
        .select('*, profiles(*)')
        .eq('project_id', projectId)
        .eq('status', 'active');

    if (error) throw error;
    return data;
};
