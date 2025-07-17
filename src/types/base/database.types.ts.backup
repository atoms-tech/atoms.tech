export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            assignments: {
                Row: {
                    assignee_id: string;
                    comment: string | null;
                    completed_at: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    due_date: string | null;
                    entity_id: string;
                    entity_type: Database['public']['Enums']['entity_type'];
                    id: string;
                    is_deleted: boolean | null;
                    role: Database['public']['Enums']['assignment_role'];
                    status: Database['public']['Enums']['requirement_status'];
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number;
                };
                Insert: {
                    assignee_id: string;
                    comment?: string | null;
                    completed_at?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    due_date?: string | null;
                    entity_id: string;
                    entity_type: Database['public']['Enums']['entity_type'];
                    id?: string;
                    is_deleted?: boolean | null;
                    role: Database['public']['Enums']['assignment_role'];
                    status: Database['public']['Enums']['requirement_status'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Update: {
                    assignee_id?: string;
                    comment?: string | null;
                    completed_at?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    due_date?: string | null;
                    entity_id?: string;
                    entity_type?: Database['public']['Enums']['entity_type'];
                    id?: string;
                    is_deleted?: boolean | null;
                    role?: Database['public']['Enums']['assignment_role'];
                    status?: Database['public']['Enums']['requirement_status'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Relationships: [];
            };
            audit_logs: {
                Row: {
                    action: string;
                    actor_id: string;
                    created_at: string;
                    entity_id: string;
                    entity_type: string;
                    id: string;
                    metadata: Json | null;
                    new_data: Json | null;
                    old_data: Json | null;
                };
                Insert: {
                    action: string;
                    actor_id: string;
                    created_at?: string;
                    entity_id: string;
                    entity_type: string;
                    id?: string;
                    metadata?: Json | null;
                    new_data?: Json | null;
                    old_data?: Json | null;
                };
                Update: {
                    action?: string;
                    actor_id?: string;
                    created_at?: string;
                    entity_id?: string;
                    entity_type?: string;
                    id?: string;
                    metadata?: Json | null;
                    new_data?: Json | null;
                    old_data?: Json | null;
                };
                Relationships: [];
            };
            billing_cache: {
                Row: {
                    billing_status: Json;
                    current_period_usage: Json;
                    organization_id: string;
                    period_end: string;
                    period_start: string;
                    synced_at: string;
                };
                Insert: {
                    billing_status?: Json;
                    current_period_usage?: Json;
                    organization_id: string;
                    period_end?: string;
                    period_start?: string;
                    synced_at?: string;
                };
                Update: {
                    billing_status?: Json;
                    current_period_usage?: Json;
                    organization_id?: string;
                    period_end?: string;
                    period_start?: string;
                    synced_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'billing_cache_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: true;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            blocks: {
                Row: {
                    content: Json | null;
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    document_id: string;
                    id: string;
                    is_deleted: boolean | null;
                    name: string;
                    org_id: string | null;
                    position: number;
                    type: string;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number;
                };
                Insert: {
                    content?: Json | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    document_id: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    name?: string;
                    org_id?: string | null;
                    position: number;
                    type: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Update: {
                    content?: Json | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    document_id?: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    name?: string;
                    org_id?: string | null;
                    position?: number;
                    type?: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'blocks_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'document_summary';
                        referencedColumns: ['document_id'];
                    },
                    {
                        foreignKeyName: 'blocks_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'documents';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'blocks_org_id_fkey';
                        columns: ['org_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            columns: {
                Row: {
                    block_id: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    default_value: string | null;
                    id: string;
                    is_hidden: boolean | null;
                    is_pinned: boolean | null;
                    position: number;
                    property_id: string;
                    updated_at: string | null;
                    updated_by: string | null;
                    width: number | null;
                };
                Insert: {
                    block_id?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    default_value?: string | null;
                    id?: string;
                    is_hidden?: boolean | null;
                    is_pinned?: boolean | null;
                    position: number;
                    property_id: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    width?: number | null;
                };
                Update: {
                    block_id?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    default_value?: string | null;
                    id?: string;
                    is_hidden?: boolean | null;
                    is_pinned?: boolean | null;
                    position?: number;
                    property_id?: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    width?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'columns_block_id_fkey';
                        columns: ['block_id'];
                        isOneToOne: false;
                        referencedRelation: 'blocks';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'columns_property_id_fkey';
                        columns: ['property_id'];
                        isOneToOne: false;
                        referencedRelation: 'properties';
                        referencedColumns: ['id'];
                    },
                ];
            };
            documents: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    name: string;
                    project_id: string;
                    slug: string;
                    tags: string[] | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    name: string;
                    project_id: string;
                    slug: string;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    name?: string;
                    project_id?: string;
                    slug?: string;
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'documents_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            excalidraw_diagrams: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    diagram_data: Json | null;
                    id: string;
                    name: string | null;
                    organization_id: string | null;
                    project_id: string | null;
                    thumbnail_url: string | null;
                    updated_at: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    diagram_data?: Json | null;
                    id?: string;
                    name?: string | null;
                    organization_id?: string | null;
                    project_id?: string | null;
                    thumbnail_url?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    diagram_data?: Json | null;
                    id?: string;
                    name?: string | null;
                    organization_id?: string | null;
                    project_id?: string | null;
                    thumbnail_url?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Relationships: [];
            };
            external_documents: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    gumloop_name: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    name: string;
                    organization_id: string;
                    owned_by: string | null;
                    size: number | null;
                    type: string | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    url: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    gumloop_name?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    name: string;
                    organization_id: string;
                    owned_by?: string | null;
                    size?: number | null;
                    type?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    url?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    gumloop_name?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    name?: string;
                    organization_id?: string;
                    owned_by?: string | null;
                    size?: number | null;
                    type?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    url?: string | null;
                };
                Relationships: [];
            };
            notifications: {
                Row: {
                    created_at: string | null;
                    id: string;
                    message: string | null;
                    metadata: Json | null;
                    read_at: string | null;
                    title: string;
                    type: Database['public']['Enums']['notification_type'];
                    unread: boolean | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    message?: string | null;
                    metadata?: Json | null;
                    read_at?: string | null;
                    title: string;
                    type: Database['public']['Enums']['notification_type'];
                    unread?: boolean | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    message?: string | null;
                    metadata?: Json | null;
                    read_at?: string | null;
                    title?: string;
                    type?: Database['public']['Enums']['notification_type'];
                    unread?: boolean | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            organization_invitations: {
                Row: {
                    created_at: string | null;
                    created_by: string;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    email: string;
                    expires_at: string;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    organization_id: string;
                    role: Database['public']['Enums']['user_role_type'];
                    status: Database['public']['Enums']['invitation_status'];
                    token: string;
                    updated_at: string | null;
                    updated_by: string;
                };
                Insert: {
                    created_at?: string | null;
                    created_by: string;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    email: string;
                    expires_at?: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    organization_id: string;
                    role?: Database['public']['Enums']['user_role_type'];
                    status?: Database['public']['Enums']['invitation_status'];
                    token?: string;
                    updated_at?: string | null;
                    updated_by: string;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    email?: string;
                    expires_at?: string;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    organization_id?: string;
                    role?: Database['public']['Enums']['user_role_type'];
                    status?: Database['public']['Enums']['invitation_status'];
                    token?: string;
                    updated_at?: string | null;
                    updated_by?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'organization_invitations_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            organization_members: {
                Row: {
                    created_at: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    last_active_at: string | null;
                    organization_id: string;
                    permissions: Json | null;
                    role: Database['public']['Enums']['user_role_type'];
                    status: Database['public']['Enums']['user_status'] | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    last_active_at?: string | null;
                    organization_id: string;
                    permissions?: Json | null;
                    role?: Database['public']['Enums']['user_role_type'];
                    status?: Database['public']['Enums']['user_status'] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    last_active_at?: string | null;
                    organization_id?: string;
                    permissions?: Json | null;
                    role?: Database['public']['Enums']['user_role_type'];
                    status?: Database['public']['Enums']['user_status'] | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'organization_members_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            organizations: {
                Row: {
                    billing_cycle: Database['public']['Enums']['pricing_plan_interval'];
                    billing_plan: Database['public']['Enums']['billing_plan'];
                    created_at: string | null;
                    created_by: string;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    logo_url: string | null;
                    max_members: number;
                    max_monthly_requests: number;
                    member_count: number | null;
                    metadata: Json | null;
                    name: string;
                    owner_id: string | null;
                    settings: Json | null;
                    slug: string;
                    status: Database['public']['Enums']['user_status'] | null;
                    storage_used: number | null;
                    type: Database['public']['Enums']['organization_type'];
                    updated_at: string | null;
                    updated_by: string;
                };
                Insert: {
                    billing_cycle?: Database['public']['Enums']['pricing_plan_interval'];
                    billing_plan?: Database['public']['Enums']['billing_plan'];
                    created_at?: string | null;
                    created_by: string;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    logo_url?: string | null;
                    max_members?: number;
                    max_monthly_requests?: number;
                    member_count?: number | null;
                    metadata?: Json | null;
                    name: string;
                    owner_id?: string | null;
                    settings?: Json | null;
                    slug: string;
                    status?: Database['public']['Enums']['user_status'] | null;
                    storage_used?: number | null;
                    type?: Database['public']['Enums']['organization_type'];
                    updated_at?: string | null;
                    updated_by: string;
                };
                Update: {
                    billing_cycle?: Database['public']['Enums']['pricing_plan_interval'];
                    billing_plan?: Database['public']['Enums']['billing_plan'];
                    created_at?: string | null;
                    created_by?: string;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    logo_url?: string | null;
                    max_members?: number;
                    max_monthly_requests?: number;
                    member_count?: number | null;
                    metadata?: Json | null;
                    name?: string;
                    owner_id?: string | null;
                    settings?: Json | null;
                    slug?: string;
                    status?: Database['public']['Enums']['user_status'] | null;
                    storage_used?: number | null;
                    type?: Database['public']['Enums']['organization_type'];
                    updated_at?: string | null;
                    updated_by?: string;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    avatar_url: string | null;
                    created_at: string | null;
                    current_organization_id: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    email: string;
                    full_name: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    job_title: string | null;
                    last_login_at: string | null;
                    login_count: number | null;
                    personal_organization_id: string | null;
                    pinned_organization_id: string | null;
                    preferences: Json | null;
                    status: Database['public']['Enums']['user_status'] | null;
                    updated_at: string | null;
                };
                Insert: {
                    avatar_url?: string | null;
                    created_at?: string | null;
                    current_organization_id?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    email: string;
                    full_name?: string | null;
                    id: string;
                    is_deleted?: boolean | null;
                    job_title?: string | null;
                    last_login_at?: string | null;
                    login_count?: number | null;
                    personal_organization_id?: string | null;
                    pinned_organization_id?: string | null;
                    preferences?: Json | null;
                    status?: Database['public']['Enums']['user_status'] | null;
                    updated_at?: string | null;
                };
                Update: {
                    avatar_url?: string | null;
                    created_at?: string | null;
                    current_organization_id?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    email?: string;
                    full_name?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    job_title?: string | null;
                    last_login_at?: string | null;
                    login_count?: number | null;
                    personal_organization_id?: string | null;
                    pinned_organization_id?: string | null;
                    preferences?: Json | null;
                    status?: Database['public']['Enums']['user_status'] | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            project_invitations: {
                Row: {
                    created_at: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    email: string;
                    expires_at: string;
                    id: string;
                    invited_by: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    project_id: string;
                    role: Database['public']['Enums']['project_role'];
                    status: Database['public']['Enums']['invitation_status'];
                    token: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    email: string;
                    expires_at?: string;
                    id?: string;
                    invited_by: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    project_id: string;
                    role?: Database['public']['Enums']['project_role'];
                    status?: Database['public']['Enums']['invitation_status'];
                    token?: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    email?: string;
                    expires_at?: string;
                    id?: string;
                    invited_by?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    project_id?: string;
                    role?: Database['public']['Enums']['project_role'];
                    status?: Database['public']['Enums']['invitation_status'];
                    token?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'project_invitations_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            project_members: {
                Row: {
                    created_at: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    last_accessed_at: string | null;
                    org_id: string | null;
                    permissions: Json | null;
                    project_id: string;
                    role: Database['public']['Enums']['project_role'];
                    status: Database['public']['Enums']['user_status'] | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    last_accessed_at?: string | null;
                    org_id?: string | null;
                    permissions?: Json | null;
                    project_id: string;
                    role?: Database['public']['Enums']['project_role'];
                    status?: Database['public']['Enums']['user_status'] | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    last_accessed_at?: string | null;
                    org_id?: string | null;
                    permissions?: Json | null;
                    project_id?: string;
                    role?: Database['public']['Enums']['project_role'];
                    status?: Database['public']['Enums']['user_status'] | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'project_members_org_id_fkey';
                        columns: ['org_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'project_members_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            projects: {
                Row: {
                    created_at: string | null;
                    created_by: string;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    metadata: Json | null;
                    name: string;
                    organization_id: string;
                    owned_by: string;
                    settings: Json | null;
                    slug: string;
                    star_count: number | null;
                    status: Database['public']['Enums']['project_status'];
                    tags: string[] | null;
                    updated_at: string | null;
                    updated_by: string;
                    version: number | null;
                    visibility: Database['public']['Enums']['visibility'];
                };
                Insert: {
                    created_at?: string | null;
                    created_by: string;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name: string;
                    organization_id: string;
                    owned_by: string;
                    settings?: Json | null;
                    slug: string;
                    star_count?: number | null;
                    status?: Database['public']['Enums']['project_status'];
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by: string;
                    version?: number | null;
                    visibility?: Database['public']['Enums']['visibility'];
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    metadata?: Json | null;
                    name?: string;
                    organization_id?: string;
                    owned_by?: string;
                    settings?: Json | null;
                    slug?: string;
                    star_count?: number | null;
                    status?: Database['public']['Enums']['project_status'];
                    tags?: string[] | null;
                    updated_at?: string | null;
                    updated_by?: string;
                    version?: number | null;
                    visibility?: Database['public']['Enums']['visibility'];
                };
                Relationships: [
                    {
                        foreignKeyName: 'projects_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            properties: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    document_id: string | null;
                    id: string;
                    is_base: boolean | null;
                    name: string;
                    options: Json | null;
                    org_id: string;
                    project_id: string | null;
                    property_type: string;
                    scope: string | null;
                    updated_at: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    document_id?: string | null;
                    id?: string;
                    is_base?: boolean | null;
                    name: string;
                    options?: Json | null;
                    org_id: string;
                    project_id?: string | null;
                    property_type: string;
                    scope?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    document_id?: string | null;
                    id?: string;
                    is_base?: boolean | null;
                    name?: string;
                    options?: Json | null;
                    org_id?: string;
                    project_id?: string | null;
                    property_type?: string;
                    scope?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'properties_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'document_summary';
                        referencedColumns: ['document_id'];
                    },
                    {
                        foreignKeyName: 'properties_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'documents';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'properties_org_id_fkey';
                        columns: ['org_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'properties_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            requirement_tests: {
                Row: {
                    created_at: string | null;
                    defects: Json | null;
                    evidence_artifacts: Json | null;
                    executed_at: string | null;
                    executed_by: string | null;
                    execution_environment: string | null;
                    execution_status: Database['public']['Enums']['execution_status'];
                    execution_version: string | null;
                    external_req_id: string | null;
                    external_test_id: string | null;
                    id: string;
                    requirement_id: string;
                    result_notes: string | null;
                    test_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    defects?: Json | null;
                    evidence_artifacts?: Json | null;
                    executed_at?: string | null;
                    executed_by?: string | null;
                    execution_environment?: string | null;
                    execution_status?: Database['public']['Enums']['execution_status'];
                    execution_version?: string | null;
                    external_req_id?: string | null;
                    external_test_id?: string | null;
                    id?: string;
                    requirement_id: string;
                    result_notes?: string | null;
                    test_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    defects?: Json | null;
                    evidence_artifacts?: Json | null;
                    executed_at?: string | null;
                    executed_by?: string | null;
                    execution_environment?: string | null;
                    execution_status?: Database['public']['Enums']['execution_status'];
                    execution_version?: string | null;
                    external_req_id?: string | null;
                    external_test_id?: string | null;
                    id?: string;
                    requirement_id?: string;
                    result_notes?: string | null;
                    test_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'requirement_tests_requirement_id_fkey';
                        columns: ['requirement_id'];
                        isOneToOne: false;
                        referencedRelation: 'requirements';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'requirement_tests_test_id_fkey';
                        columns: ['test_id'];
                        isOneToOne: false;
                        referencedRelation: 'test_req';
                        referencedColumns: ['id'];
                    },
                ];
            };
            requirements: {
                Row: {
                    ai_analysis: Json | null;
                    block_id: string;
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    description: string | null;
                    document_id: string;
                    enchanced_requirement: string | null;
                    external_id: string | null;
                    format: Database['public']['Enums']['requirement_format'];
                    id: string;
                    is_deleted: boolean | null;
                    level: Database['public']['Enums']['requirement_level'];
                    name: string;
                    original_requirement: string | null;
                    position: number;
                    priority: Database['public']['Enums']['requirement_priority'];
                    properties: Json | null;
                    status: Database['public']['Enums']['requirement_status'];
                    tags: string[] | null;
                    type: string | null;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number;
                };
                Insert: {
                    ai_analysis?: Json | null;
                    block_id: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    document_id: string;
                    enchanced_requirement?: string | null;
                    external_id?: string | null;
                    format?: Database['public']['Enums']['requirement_format'];
                    id?: string;
                    is_deleted?: boolean | null;
                    level?: Database['public']['Enums']['requirement_level'];
                    name: string;
                    original_requirement?: string | null;
                    position?: number;
                    priority?: Database['public']['Enums']['requirement_priority'];
                    properties?: Json | null;
                    status?: Database['public']['Enums']['requirement_status'];
                    tags?: string[] | null;
                    type?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Update: {
                    ai_analysis?: Json | null;
                    block_id?: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    document_id?: string;
                    enchanced_requirement?: string | null;
                    external_id?: string | null;
                    format?: Database['public']['Enums']['requirement_format'];
                    id?: string;
                    is_deleted?: boolean | null;
                    level?: Database['public']['Enums']['requirement_level'];
                    name?: string;
                    original_requirement?: string | null;
                    position?: number;
                    priority?: Database['public']['Enums']['requirement_priority'];
                    properties?: Json | null;
                    status?: Database['public']['Enums']['requirement_status'];
                    tags?: string[] | null;
                    type?: string | null;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'requirements_block_id_fkey';
                        columns: ['block_id'];
                        isOneToOne: false;
                        referencedRelation: 'blocks';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'requirements_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'document_summary';
                        referencedColumns: ['document_id'];
                    },
                    {
                        foreignKeyName: 'requirements_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'documents';
                        referencedColumns: ['id'];
                    },
                ];
            };
            stripe_customers: {
                Row: {
                    cancel_at_period_end: boolean | null;
                    created_at: string | null;
                    current_period_end: string | null;
                    current_period_start: string | null;
                    id: string;
                    organization_id: string | null;
                    payment_method_brand: string | null;
                    payment_method_last4: string | null;
                    price_id: string | null;
                    stripe_customer_id: string | null;
                    stripe_subscription_id: string | null;
                    subscription_status: Database['public']['Enums']['subscription_status'];
                    updated_at: string | null;
                };
                Insert: {
                    cancel_at_period_end?: boolean | null;
                    created_at?: string | null;
                    current_period_end?: string | null;
                    current_period_start?: string | null;
                    id?: string;
                    organization_id?: string | null;
                    payment_method_brand?: string | null;
                    payment_method_last4?: string | null;
                    price_id?: string | null;
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    subscription_status: Database['public']['Enums']['subscription_status'];
                    updated_at?: string | null;
                };
                Update: {
                    cancel_at_period_end?: boolean | null;
                    created_at?: string | null;
                    current_period_end?: string | null;
                    current_period_start?: string | null;
                    id?: string;
                    organization_id?: string | null;
                    payment_method_brand?: string | null;
                    payment_method_last4?: string | null;
                    price_id?: string | null;
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    subscription_status?: Database['public']['Enums']['subscription_status'];
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'stripe_customers_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: true;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            test_matrix_views: {
                Row: {
                    configuration: Json;
                    created_at: string | null;
                    created_by: string;
                    id: string;
                    is_active: boolean | null;
                    is_default: boolean | null;
                    name: string;
                    project_id: string;
                    updated_at: string | null;
                    updated_by: string;
                };
                Insert: {
                    configuration?: Json;
                    created_at?: string | null;
                    created_by: string;
                    id?: string;
                    is_active?: boolean | null;
                    is_default?: boolean | null;
                    name: string;
                    project_id: string;
                    updated_at?: string | null;
                    updated_by: string;
                };
                Update: {
                    configuration?: Json;
                    created_at?: string | null;
                    created_by?: string;
                    id?: string;
                    is_active?: boolean | null;
                    is_default?: boolean | null;
                    name?: string;
                    project_id?: string;
                    updated_at?: string | null;
                    updated_by?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'test_matrix_views_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            test_req: {
                Row: {
                    attachments: Json | null;
                    category: string[] | null;
                    created_at: string | null;
                    created_by: string | null;
                    description: string | null;
                    estimated_duration: unknown | null;
                    expected_results: string | null;
                    id: string;
                    is_active: boolean | null;
                    method: Database['public']['Enums']['test_method'];
                    preconditions: string | null;
                    priority: Database['public']['Enums']['test_priority'];
                    project_id: string | null;
                    result: string | null;
                    status: Database['public']['Enums']['test_status'];
                    test_environment: string | null;
                    test_id: string | null;
                    test_steps: Json | null;
                    test_type: Database['public']['Enums']['test_type'];
                    title: string;
                    updated_at: string | null;
                    updated_by: string | null;
                    version: string | null;
                };
                Insert: {
                    attachments?: Json | null;
                    category?: string[] | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    estimated_duration?: unknown | null;
                    expected_results?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    method?: Database['public']['Enums']['test_method'];
                    preconditions?: string | null;
                    priority?: Database['public']['Enums']['test_priority'];
                    project_id?: string | null;
                    result?: string | null;
                    status?: Database['public']['Enums']['test_status'];
                    test_environment?: string | null;
                    test_id?: string | null;
                    test_steps?: Json | null;
                    test_type?: Database['public']['Enums']['test_type'];
                    title: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: string | null;
                };
                Update: {
                    attachments?: Json | null;
                    category?: string[] | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    estimated_duration?: unknown | null;
                    expected_results?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    method?: Database['public']['Enums']['test_method'];
                    preconditions?: string | null;
                    priority?: Database['public']['Enums']['test_priority'];
                    project_id?: string | null;
                    result?: string | null;
                    status?: Database['public']['Enums']['test_status'];
                    test_environment?: string | null;
                    test_id?: string | null;
                    test_steps?: Json | null;
                    test_type?: Database['public']['Enums']['test_type'];
                    title?: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'test_req_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            trace_links: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    description: string | null;
                    id: string;
                    is_deleted: boolean | null;
                    link_type: Database['public']['Enums']['trace_link_type'];
                    source_id: string;
                    source_type: Database['public']['Enums']['entity_type'];
                    target_id: string;
                    target_type: Database['public']['Enums']['entity_type'];
                    updated_at: string | null;
                    updated_by: string | null;
                    version: number;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    link_type: Database['public']['Enums']['trace_link_type'];
                    source_id: string;
                    source_type: Database['public']['Enums']['entity_type'];
                    target_id: string;
                    target_type: Database['public']['Enums']['entity_type'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    link_type?: Database['public']['Enums']['trace_link_type'];
                    source_id?: string;
                    source_type?: Database['public']['Enums']['entity_type'];
                    target_id?: string;
                    target_type?: Database['public']['Enums']['entity_type'];
                    updated_at?: string | null;
                    updated_by?: string | null;
                    version?: number;
                };
                Relationships: [];
            };
            usage_logs: {
                Row: {
                    created_at: string | null;
                    feature: string;
                    id: string;
                    metadata: Json | null;
                    organization_id: string;
                    quantity: number;
                    unit_type: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    feature: string;
                    id?: string;
                    metadata?: Json | null;
                    organization_id: string;
                    quantity: number;
                    unit_type: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    feature?: string;
                    id?: string;
                    metadata?: Json | null;
                    organization_id?: string;
                    quantity?: number;
                    unit_type?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'usage_logs_organization_id_fkey';
                        columns: ['organization_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_roles: {
                Row: {
                    admin_role:
                        | Database['public']['Enums']['user_role_type']
                        | null;
                    created_at: string;
                    document_id: string | null;
                    document_role:
                        | Database['public']['Enums']['project_role']
                        | null;
                    id: string;
                    org_id: string | null;
                    project_id: string | null;
                    project_role:
                        | Database['public']['Enums']['project_role']
                        | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    admin_role?:
                        | Database['public']['Enums']['user_role_type']
                        | null;
                    created_at?: string;
                    document_id?: string | null;
                    document_role?:
                        | Database['public']['Enums']['project_role']
                        | null;
                    id?: string;
                    org_id?: string | null;
                    project_id?: string | null;
                    project_role?:
                        | Database['public']['Enums']['project_role']
                        | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    admin_role?:
                        | Database['public']['Enums']['user_role_type']
                        | null;
                    created_at?: string;
                    document_id?: string | null;
                    document_role?:
                        | Database['public']['Enums']['project_role']
                        | null;
                    id?: string;
                    org_id?: string | null;
                    project_id?: string | null;
                    project_role?:
                        | Database['public']['Enums']['project_role']
                        | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_roles_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'document_summary';
                        referencedColumns: ['document_id'];
                    },
                    {
                        foreignKeyName: 'user_roles_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'documents';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'user_roles_org_id_fkey';
                        columns: ['org_id'];
                        isOneToOne: false;
                        referencedRelation: 'organizations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'user_roles_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            document_summary: {
                Row: {
                    block_count: number | null;
                    document_id: string | null;
                    document_name: string | null;
                    project_id: string | null;
                    requirement_count: number | null;
                    updated_at: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'documents_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Functions: {
            accept_invitation: {
                Args: { invitation_token: string };
                Returns: boolean;
            };
            can_use_resource: {
                Args: {
                    org_id: string;
                    resource_type: string;
                    quantity: number;
                };
                Returns: boolean;
            };
            create_columns_for_table_block: {
                Args: { block_id: string; p_org_id: string };
                Returns: undefined;
            };
            create_notification: {
                Args: {
                    user_id: string;
                    type: Database['public']['Enums']['notification_type'];
                    title: string;
                    message?: string;
                    metadata?: Json;
                };
                Returns: string;
            };
            create_personal_organization: {
                Args: { user_id: string; name: string };
                Returns: string;
            };
            gbt_bit_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_bool_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_bool_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_bpchar_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_bytea_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_cash_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_cash_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_date_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_date_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_decompress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_enum_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_enum_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_float4_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_float4_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_float8_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_float8_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_inet_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_int2_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_int2_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_int4_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_int4_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_int8_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_int8_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_intv_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_intv_decompress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_intv_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_macad_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_macad_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_macad8_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_macad8_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_numeric_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_oid_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_oid_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_text_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_time_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_time_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_timetz_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_ts_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_ts_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_tstz_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_uuid_compress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_uuid_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_var_decompress: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbt_var_fetch: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey_var_in: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey_var_out: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey16_in: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey16_out: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey2_in: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey2_out: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey32_in: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey32_out: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey4_in: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey4_out: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey8_in: {
                Args: { '': unknown };
                Returns: unknown;
            };
            gbtreekey8_out: {
                Args: { '': unknown };
                Returns: unknown;
            };
            generate_slug: {
                Args: { name: string };
                Returns: string;
            };
            get_organization_usage: {
                Args: {
                    org_id: string;
                    start_date?: string;
                    end_date?: string;
                };
                Returns: Json;
            };
            get_user_organizations: {
                Args: { user_id: string; include_inactive?: boolean };
                Returns: {
                    id: string;
                    name: string;
                    slug: string;
                    role: Database['public']['Enums']['user_role_type'];
                    type: Database['public']['Enums']['organization_type'];
                    billing_plan: Database['public']['Enums']['billing_plan'];
                    member_count: number;
                    is_personal: boolean;
                    status: Database['public']['Enums']['user_status'];
                }[];
            };
            has_project_access: {
                Args: {
                    project_id: string;
                    user_id: string;
                    required_role?: Database['public']['Enums']['project_role'];
                };
                Returns: boolean;
            };
            initialize_billing: {
                Args: { user_id: string; org_id: string };
                Returns: undefined;
            };
            invite_organization_member: {
                Args: {
                    org_id: string;
                    email: string;
                    role?: Database['public']['Enums']['user_role_type'];
                };
                Returns: string;
            };
            is_project_owner_or_admin: {
                Args: { project_id: string; user_id: string };
                Returns: boolean;
            };
            is_valid_email: {
                Args: { email: string };
                Returns: boolean;
            };
            is_valid_slug: {
                Args: { slug: string };
                Returns: boolean;
            };
            log_resource_usage: {
                Args: {
                    org_id: string;
                    user_id: string;
                    feature: string;
                    quantity: number;
                    unit_type: string;
                    metadata?: Json;
                };
                Returns: boolean;
            };
            reorder_blocks: {
                Args: {
                    p_document_id: string;
                    p_block_ids: string[];
                    p_user_id: string;
                };
                Returns: undefined;
            };
            switch_organization: {
                Args: { user_id: string; org_id: string };
                Returns: boolean;
            };
            sync_billing_data: {
                Args: { org_id: string };
                Returns: Json;
            };
        };
        Enums: {
            assignment_role: 'assignee' | 'reviewer' | 'approver';
            billing_plan: 'free' | 'pro' | 'enterprise';
            entity_type: 'document' | 'requirement';
            execution_status:
                | 'not_executed'
                | 'in_progress'
                | 'passed'
                | 'failed'
                | 'blocked'
                | 'skipped';
            invitation_status: 'pending' | 'accepted' | 'rejected' | 'revoked';
            notification_type: 'invitation' | 'mention' | 'system';
            organization_type: 'personal' | 'team' | 'enterprise';
            pricing_plan_interval: 'none' | 'month' | 'year';
            project_role:
                | 'owner'
                | 'admin'
                | 'maintainer'
                | 'editor'
                | 'viewer';
            project_status: 'active' | 'archived' | 'draft' | 'deleted';
            property_type:
                | 'text'
                | 'number'
                | 'boolean'
                | 'date'
                | 'url'
                | 'array'
                | 'enum'
                | 'entity_reference'
                | 'select'
                | 'multi_select'
                | 'file';
            requirement_format: 'incose' | 'ears' | 'other';
            requirement_level: 'component' | 'system' | 'subsystem';
            requirement_priority: 'low' | 'medium' | 'high' | 'critical';
            requirement_status:
                | 'active'
                | 'archived'
                | 'draft'
                | 'deleted'
                | 'in_review'
                | 'in_progress'
                | 'approved'
                | 'rejected';
            subscription_status:
                | 'active'
                | 'inactive'
                | 'trialing'
                | 'past_due'
                | 'canceled'
                | 'paused';
            test_method: 'manual' | 'automated' | 'hybrid';
            test_priority: 'critical' | 'high' | 'medium' | 'low';
            test_status:
                | 'draft'
                | 'ready'
                | 'in_progress'
                | 'blocked'
                | 'completed'
                | 'obsolete';
            test_type:
                | 'unit'
                | 'integration'
                | 'system'
                | 'acceptance'
                | 'performance'
                | 'security'
                | 'usability'
                | 'other';
            trace_link_type:
                | 'derives_from'
                | 'implements'
                | 'relates_to'
                | 'conflicts_with'
                | 'is_related_to'
                | 'parent_of'
                | 'child_of';
            user_role_type: 'member' | 'admin' | 'owner' | 'super_admin';
            user_status: 'active' | 'inactive';
            visibility: 'private' | 'team' | 'organization' | 'public';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {
            assignment_role: ['assignee', 'reviewer', 'approver'],
            billing_plan: ['free', 'pro', 'enterprise'],
            entity_type: ['document', 'requirement'],
            execution_status: [
                'not_executed',
                'in_progress',
                'passed',
                'failed',
                'blocked',
                'skipped',
            ],
            invitation_status: ['pending', 'accepted', 'rejected', 'revoked'],
            notification_type: ['invitation', 'mention', 'system'],
            organization_type: ['personal', 'team', 'enterprise'],
            pricing_plan_interval: ['none', 'month', 'year'],
            project_role: ['owner', 'admin', 'maintainer', 'editor', 'viewer'],
            project_status: ['active', 'archived', 'draft', 'deleted'],
            property_type: [
                'text',
                'number',
                'boolean',
                'date',
                'url',
                'array',
                'enum',
                'entity_reference',
                'select',
                'multi_select',
                'file',
            ],
            requirement_format: ['incose', 'ears', 'other'],
            requirement_level: ['component', 'system', 'subsystem'],
            requirement_priority: ['low', 'medium', 'high', 'critical'],
            requirement_status: [
                'active',
                'archived',
                'draft',
                'deleted',
                'in_review',
                'in_progress',
                'approved',
                'rejected',
            ],
            subscription_status: [
                'active',
                'inactive',
                'trialing',
                'past_due',
                'canceled',
                'paused',
            ],
            test_method: ['manual', 'automated', 'hybrid'],
            test_priority: ['critical', 'high', 'medium', 'low'],
            test_status: [
                'draft',
                'ready',
                'in_progress',
                'blocked',
                'completed',
                'obsolete',
            ],
            test_type: [
                'unit',
                'integration',
                'system',
                'acceptance',
                'performance',
                'security',
                'usability',
                'other',
            ],
            trace_link_type: [
                'derives_from',
                'implements',
                'relates_to',
                'conflicts_with',
                'is_related_to',
                'parent_of',
                'child_of',
            ],
            user_role_type: ['member', 'admin', 'owner', 'super_admin'],
            user_status: ['active', 'inactive'],
            visibility: ['private', 'team', 'organization', 'public'],
        },
    },
} as const;
