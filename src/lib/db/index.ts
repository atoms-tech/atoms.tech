import { supabase as browserClient } from '@/lib/supabase/supabaseBrowser';
import { createClient as createServerClient } from '@/lib/supabase/supabaseServer';
import { DocumentSchema } from '@/types/validation/documents.validation';
import { OrganizationSchema } from '@/types/validation/organizations.validation';
import { ProfileSchema } from '@/types/validation/profiles.validation';
import { ProjectSchema } from '@/types/validation/projects.validation';

// ========================================================================
// Function to get the appropriate Supabase client
// ========================================================================
const getSupabaseClient = () => {
    if (typeof window === 'undefined') {
        // Server-side
        return createServerClient();
    } else {
        // Client-side
        return browserClient;
    }
};

// ========================================================================
// Get User Profile using userId
// ========================================================================
export const getAuthUser = async () => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
};

// ========================================================================
// Get User Profile using userId
// ========================================================================
export const getUserProfile = async (userId: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return ProfileSchema.parse(data);
};

// ========================================================================
// Get User Organizations by searching organization_members
// and returning the organizations that the user is a member of
// ========================================================================
export const getUserOrganizations = async (userId: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
        .from('organization_members')
        .select(
            `
            organizations!inner(*)
        `,
        ) // Join the organizations table (inner join)
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('is_deleted', false);

    if (error) {
        console.error('Error fetching memberships:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        console.log('No memberships found for user:', userId);
        return []; // Return an empty array if no memberships are found
    }

    // Extract organizations from the joined data
    const organizations = data.map((member) => member.organizations);
    // Parse and return the organizations
    return organizations.map((org) => OrganizationSchema.parse(org));
};

// ========================================================================
// Get User Projects by searching project_members and returning
// the projects that the user is a member of
// ========================================================================
export const getUserProjects = async (userId: string, orgId: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
        .from('project_members')
        .select(
            `
            projects!inner(*)
        `,
        )
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('projects.is_deleted', false) // Filter projects by is_deleted
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching project members:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        console.log('No projects found for user:', userId);
        return []; // Return an empty array if no projects are found
    }

    // Extract projects from the joined data
    const projects = data.map((member) => member.projects);
    // Parse and return the projects
    return projects.map((project) => ProjectSchema.parse(project));
};

export const getProjectDocuments = async (projectId: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false);

    if (error) throw error;
    return data.map((doc) => DocumentSchema.parse(doc));
};

export const getDocumentData = async (documentId: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
        .from('documents')
        .select(
            `
      id,
      name,
      description,
      blocks:blocks!inner(
        id,
        type,
        content,
        position,
        requirements:requirements!inner(
          id,
          name,
          description,
          status,
          format,
          priority,
          level,
          tags,
          original_requirement,
          enchanced_requirement,
          ai_analysis,
          position
        )
      )
    `,
        )
        .eq('id', documentId)
        .single();

    if (error) throw error;
    return data;
};

export const getBlockItems = async (blockId: string) => {};

export const getOrganizationMembers = async (organizationId: string) => {};

export const getProjectMembers = async (projectId: string) => {};
