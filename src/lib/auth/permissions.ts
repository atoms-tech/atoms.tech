export type OrganizationRole = keyof typeof ORGANIZATION_ROLES;
type OrganizationPermission =
    (typeof ORGANIZATION_ROLES)[OrganizationRole][number];
export type ProjectRole = keyof typeof PROJECT_ROLES;
type ProjectPermission = (typeof PROJECT_ROLES)[ProjectRole][number];

const ORGANIZATION_ROLES = {
    owner: [
        'assignToProject',
        'changeRole',
        'uploadDeleteDocs',
        'invitePeople',
        'createProjects',
        'goToCanvas',
        'goToAiAnalysis',
        'viewProjects',
        'viewDocs',
        'removeMember',
        'manageDocs',
    ],
    admin: [
        'assignToProject',
        'uploadDeleteDocs',
        'createProjects',
        'goToCanvas',
        'goToAiAnalysis',
        'viewProjects',
        'viewDocs',
        'manageDocs',
    ],
    member: ['viewProjects', 'viewDocs'],
} as const;

// Use if you need all Organization Roles as an array
export const ORGANIZATION_ROLE_ARRAY = Object.keys(
    ORGANIZATION_ROLES,
) as OrganizationRole[];

export function hasOrganizationPermission(
    role: OrganizationRole | null,
    permission: OrganizationPermission,
) {
    return role
        ? (
              ORGANIZATION_ROLES[role] as readonly OrganizationPermission[]
          )?.includes(permission)
        : false;
}

const PROJECT_ROLES = {
    owner: [
        'changeRole',
        'removeMember',
        'addDocument',
        'viewDocument',
        'deleteDocument',
        'editDocument',
        'editProject',
        'deleteProject',
    ],
    editor: ['addDocument', 'viewDocument', 'deleteDocument', 'editDocument'],
    viewer: ['viewDocument'],
} as const;

// Use if you need all Project Roles as an array
export const PROJECT_ROLE_ARRAY = Object.keys(PROJECT_ROLES) as ProjectRole[];

export function hasProjectPermission(
    role: ProjectRole | null,
    permission: ProjectPermission,
) {
    return role
        ? (PROJECT_ROLES[role] as readonly ProjectPermission[])?.includes(
              permission,
          )
        : false;
}
