import type { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

export const getProjectBySlug = async (
    supabase: SupabaseClient<Database>,
    slug: string,
) => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) throw error;
    return data;
};

export const getUserProjects = async (
    supabase: SupabaseClient<Database>,
    userId: string,
    orgId: string,
) => {
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

    return projectData;
};

export const getProjectMembers = async (
    supabase: SupabaseClient<Database>,
    projectId: string,
) => {
    // Fetch all members of the project along with their roles
    const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('user_id, role')
        .eq('project_id', projectId)
        .eq('status', 'active');

    if (membersError) {
        console.error('Error fetching project members:', membersError);
        throw membersError;
    }

    if (!members || members.length === 0) {
        console.log('No members found for project:', projectId);
        return [];
    }

    // Extract user IDs and roles from the members
    const userIds = members.map((member) => member.user_id);
    const userRoles = members.reduce(
        (acc, member) => {
            acc[member.user_id] = member.role;
            return acc;
        },
        {} as Record<string, string>,
    );

    // Fetch profiles for the extracted user IDs
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
    }

    // Attach roles to the profiles
    return profiles.map((profile) => ({
        ...profile,
        role: userRoles[profile.id],
    }));
};
