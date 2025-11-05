export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '12.2.3 (519615d)';
    };
    public: {
        Tables: {
            admin_audit_log: {
                Row: {
                    id: string;
                    admin_id: string;
                    action: string;
                    target_org_id: string | null;
                    target_user_id: string | null;
                    details: Json | null;
                    ip_address: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    admin_id: string;
                    action: string;
                    target_org_id?: string | null;
                    target_user_id?: string | null;
                    details?: Json | null;
                    ip_address?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    admin_id?: string;
                    action?: string;
                    target_org_id?: string | null;
                    target_user_id?: string | null;
                    details?: Json | null;
                    ip_address?: string | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            agent_health: {
                Row: {
                    id: string;
                    agent_id: string;
                    status: string;
                    last_check: string | null;
                    last_error: string | null;
                    consecutive_failures: number;
                    metadata: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    agent_id: string;
                    status: string;
                    last_check?: string | null;
                    last_error?: string | null;
                    consecutive_failures?: number;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    agent_id?: string;
                    status?: string;
                    last_check?: string | null;
                    last_error?: string | null;
                    consecutive_failures?: number;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            agents: {
                Row: {
                    id: string;
                    name: string;
                    type: string;
                    description: string | null;
                    enabled: boolean;
                    config: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    type: string;
                    description?: string | null;
                    enabled?: boolean;
                    config?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    type?: string;
                    description?: string | null;
                    enabled?: boolean;
                    config?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            api_keys: {
                Row: {
                    id: string;
                    user_id: string;
                    organization_id: string;
                    key_hash: string;
                    name: string | null;
                    description: string | null;
                    is_active: boolean;
                    expires_at: string | null;
                    created_at: string;
                    updated_at: string;
                    last_used_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    organization_id: string;
                    key_hash: string;
                    name?: string | null;
                    description?: string | null;
                    is_active?: boolean;
                    expires_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_used_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    organization_id?: string;
                    key_hash?: string;
                    name?: string | null;
                    description?: string | null;
                    is_active?: boolean;
                    expires_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_used_at?: string | null;
                };
                Relationships: never[];
            };
            assignments: {
                Row: {
                    id: string;
                    entity_id: string;
                    entity_type: "document" | "requirement";
                    assignee_id: string;
                    role: "assignee" | "reviewer" | "approver";
                    status: "active" | "archived" | "draft" | "deleted" | "in_review" | "in_progress" | "approved" | "rejected";
                    comment: string | null;
                    due_date: string | null;
                    completed_at: string | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                    version: number;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                };
                Insert: {
                    id?: string;
                    entity_id: string;
                    entity_type: "document" | "requirement";
                    assignee_id: string;
                    role: "assignee" | "reviewer" | "approver";
                    status: "active" | "archived" | "draft" | "deleted" | "in_review" | "in_progress" | "approved" | "rejected";
                    comment?: string | null;
                    due_date?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Update: {
                    id?: string;
                    entity_id?: string;
                    entity_type?: "document" | "requirement";
                    assignee_id?: string;
                    role?: "assignee" | "reviewer" | "approver";
                    status?: "active" | "archived" | "draft" | "deleted" | "in_review" | "in_progress" | "approved" | "rejected";
                    comment?: string | null;
                    due_date?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Relationships: never[];
            };
            audit_logs: {
                Row: {
                    id: string;
                    entity_id: string;
                    entity_type: string;
                    action: string;
                    actor_id: string | null;
                    old_data: Json | null;
                    new_data: Json | null;
                    metadata: Json | null;
                    created_at: string;
                    timestamp: string | null;
                    event_type: "login" | "logout" | "login_failed" | "password_change" | "mfa_enabled" | "mfa_disabled" | "permission_granted" | "permission_denied" | "role_assigned" | "role_removed" | "data_created" | "data_read" | "data_updated" | "data_deleted" | "data_exported" | "system_config_changed" | "backup_created" | "backup_restored" | "security_violation" | "suspicious_activity" | "rate_limit_exceeded" | "compliance_report_generated" | "audit_log_accessed" | "data_retention_applied" | null;
                    severity: "low" | "medium" | "high" | "critical";
                    user_id: string | null;
                    session_id: string | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    resource_type: "organization" | "project" | "document" | "requirement" | "user" | "member" | "invitation" | "role" | "permission" | "external_document" | "diagram" | "trace_link" | "assignment" | "audit_log" | "security_event" | "system_config" | "compliance_report" | null;
                    resource_id: string | null;
                    organization_id: string | null;
                    project_id: string | null;
                    description: string | null;
                    details: Json | null;
                    soc2_control: string | null;
                    compliance_category: string | null;
                    risk_level: string | null;
                    threat_indicators: string[] | null;
                    source_system: string | null;
                    correlation_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    id?: string;
                    entity_id: string;
                    entity_type: string;
                    action: string;
                    actor_id?: string | null;
                    old_data?: Json | null;
                    new_data?: Json | null;
                    metadata?: Json | null;
                    created_at?: string;
                    timestamp?: string | null;
                    event_type?: "login" | "logout" | "login_failed" | "password_change" | "mfa_enabled" | "mfa_disabled" | "permission_granted" | "permission_denied" | "role_assigned" | "role_removed" | "data_created" | "data_read" | "data_updated" | "data_deleted" | "data_exported" | "system_config_changed" | "backup_created" | "backup_restored" | "security_violation" | "suspicious_activity" | "rate_limit_exceeded" | "compliance_report_generated" | "audit_log_accessed" | "data_retention_applied" | null;
                    severity?: "low" | "medium" | "high" | "critical";
                    user_id?: string | null;
                    session_id?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    resource_type?: "organization" | "project" | "document" | "requirement" | "user" | "member" | "invitation" | "role" | "permission" | "external_document" | "diagram" | "trace_link" | "assignment" | "audit_log" | "security_event" | "system_config" | "compliance_report" | null;
                    resource_id?: string | null;
                    organization_id?: string | null;
                    project_id?: string | null;
                    description?: string | null;
                    details?: Json | null;
                    soc2_control?: string | null;
                    compliance_category?: string | null;
                    risk_level?: string | null;
                    threat_indicators?: string[] | null;
                    source_system?: string | null;
                    correlation_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    entity_id?: string;
                    entity_type?: string;
                    action?: string;
                    actor_id?: string | null;
                    old_data?: Json | null;
                    new_data?: Json | null;
                    metadata?: Json | null;
                    created_at?: string;
                    timestamp?: string | null;
                    event_type?: "login" | "logout" | "login_failed" | "password_change" | "mfa_enabled" | "mfa_disabled" | "permission_granted" | "permission_denied" | "role_assigned" | "role_removed" | "data_created" | "data_read" | "data_updated" | "data_deleted" | "data_exported" | "system_config_changed" | "backup_created" | "backup_restored" | "security_violation" | "suspicious_activity" | "rate_limit_exceeded" | "compliance_report_generated" | "audit_log_accessed" | "data_retention_applied" | null;
                    severity?: "low" | "medium" | "high" | "critical";
                    user_id?: string | null;
                    session_id?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    resource_type?: "organization" | "project" | "document" | "requirement" | "user" | "member" | "invitation" | "role" | "permission" | "external_document" | "diagram" | "trace_link" | "assignment" | "audit_log" | "security_event" | "system_config" | "compliance_report" | null;
                    resource_id?: string | null;
                    organization_id?: string | null;
                    project_id?: string | null;
                    description?: string | null;
                    details?: Json | null;
                    soc2_control?: string | null;
                    compliance_category?: string | null;
                    risk_level?: string | null;
                    threat_indicators?: string[] | null;
                    source_system?: string | null;
                    correlation_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: never[];
            };
            billing_cache: {
                Row: {
                    organization_id: string;
                    billing_status: Json;
                    current_period_usage: Json;
                    synced_at: string;
                    period_start: string;
                    period_end: string;
                };
                Insert: {
                    organization_id: string;
                    billing_status: Json;
                    current_period_usage: Json;
                    synced_at?: string;
                    period_start?: string;
                    period_end?: string;
                };
                Update: {
                    organization_id?: string;
                    billing_status?: Json;
                    current_period_usage?: Json;
                    synced_at?: string;
                    period_start?: string;
                    period_end?: string;
                };
                Relationships: never[];
            };
            blocks: {
                Row: {
                    id: string;
                    document_id: string;
                    type: string;
                    position: number;
                    content: Json | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                    version: number;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    org_id: string | null;
                    name: string;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    type: string;
                    position: number;
                    content?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    org_id?: string | null;
                    name?: string;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    type?: string;
                    position?: number;
                    content?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    org_id?: string | null;
                    name?: string;
                };
                Relationships: never[];
            };
            chat_messages: {
                Row: {
                    id: string;
                    session_id: string;
                    role: string;
                    content: string | null;
                    tokens: number | null;
                    metadata: Json | null;
                    created_at: string | null;
                    parent_id: string | null;
                    variant_index: number;
                    is_active: boolean;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    role: string;
                    content?: string | null;
                    tokens?: number | null;
                    metadata?: Json | null;
                    created_at?: string | null;
                    parent_id?: string | null;
                    variant_index?: number;
                    is_active?: boolean;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    role?: string;
                    content?: string | null;
                    tokens?: number | null;
                    metadata?: Json | null;
                    created_at?: string | null;
                    parent_id?: string | null;
                    variant_index?: number;
                    is_active?: boolean;
                };
                Relationships: [
                    {
                        foreignKeyName: 'chat_messages_session_id_fkey';
                        columns: ['session_id'];
                        isOneToOne: false;
                        referencedRelation: 'chat_sessions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_chat_messages_parent_session';
                        columns: ['parent_id', 'session_id'];
                        isOneToOne: false;
                        referencedRelation: 'chat_messages';
                        referencedColumns: ['id', 'session_id'];
                    },
                ];
            };
            chat_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    organization_id: string | null;
                    title: string | null;
                    model: string | null;
                    agent_type: string | null;
                    metadata: Json | null;
                    created_at: string | null;
                    updated_at: string | null;
                    last_message_at: string | null;
                    message_count: number | null;
                    tokens_in: number | null;
                    tokens_out: number | null;
                    tokens_total: number | null;
                    archived: boolean | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    organization_id?: string | null;
                    title?: string | null;
                    model?: string | null;
                    agent_type?: string | null;
                    metadata?: Json | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                    last_message_at?: string | null;
                    message_count?: number | null;
                    tokens_in?: number | null;
                    tokens_out?: number | null;
                    tokens_total?: number | null;
                    archived?: boolean | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    organization_id?: string | null;
                    title?: string | null;
                    model?: string | null;
                    agent_type?: string | null;
                    metadata?: Json | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                    last_message_at?: string | null;
                    message_count?: number | null;
                    tokens_in?: number | null;
                    tokens_out?: number | null;
                    tokens_total?: number | null;
                    archived?: boolean | null;
                };
                Relationships: never[];
            };
            columns: {
                Row: {
                    id: string;
                    block_id: string | null;
                    property_id: string;
                    position: number;
                    width: number;
                    is_hidden: boolean;
                    is_pinned: boolean;
                    created_at: string;
                    updated_at: string;
                    default_value: string | null;
                    created_by: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    id?: string;
                    block_id?: string | null;
                    property_id: string;
                    position: number;
                    width?: number;
                    is_hidden?: boolean;
                    is_pinned?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    default_value?: string | null;
                    created_by?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    id?: string;
                    block_id?: string | null;
                    property_id?: string;
                    position?: number;
                    width?: number;
                    is_hidden?: boolean;
                    is_pinned?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    default_value?: string | null;
                    created_by?: string | null;
                    updated_by?: string | null;
                };
                Relationships: never[];
            };
            diagram_element_links: {
                Row: {
                    id: string;
                    diagram_id: string;
                    element_id: string;
                    requirement_id: string;
                    link_type: string;
                    metadata: Json | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                };
                Insert: {
                    id?: string;
                    diagram_id: string;
                    element_id: string;
                    requirement_id: string;
                    link_type?: string;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                };
                Update: {
                    id?: string;
                    diagram_id?: string;
                    element_id?: string;
                    requirement_id?: string;
                    link_type?: string;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                };
                Relationships: never[];
            };
            diagram_element_links_with_details: {
                Row: {
                    id: string | null;
                    diagram_id: string | null;
                    element_id: string | null;
                    requirement_id: string | null;
                    link_type: string | null;
                    metadata: Json | null;
                    created_at: string | null;
                    updated_at: string | null;
                    created_by: string | null;
                    created_by_name: string | null;
                    created_by_avatar: string | null;
                    requirement_name: string | null;
                    requirement_description: string | null;
                    diagram_name: string | null;
                };
                Insert: {
                    id?: string | null;
                    diagram_id?: string | null;
                    element_id?: string | null;
                    requirement_id?: string | null;
                    link_type?: string | null;
                    metadata?: Json | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                    created_by?: string | null;
                    created_by_name?: string | null;
                    created_by_avatar?: string | null;
                    requirement_name?: string | null;
                    requirement_description?: string | null;
                    diagram_name?: string | null;
                };
                Update: {
                    id?: string | null;
                    diagram_id?: string | null;
                    element_id?: string | null;
                    requirement_id?: string | null;
                    link_type?: string | null;
                    metadata?: Json | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                    created_by?: string | null;
                    created_by_name?: string | null;
                    created_by_avatar?: string | null;
                    requirement_name?: string | null;
                    requirement_description?: string | null;
                    diagram_name?: string | null;
                };
                Relationships: never[];
            };
            document_summary: {
                Row: {
                    document_id: string | null;
                    document_name: string | null;
                    project_id: string | null;
                    block_count: number | null;
                    requirement_count: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    document_id?: string | null;
                    document_name?: string | null;
                    project_id?: string | null;
                    block_count?: number | null;
                    requirement_count?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    document_id?: string | null;
                    document_name?: string | null;
                    project_id?: string | null;
                    block_count?: number | null;
                    requirement_count?: number | null;
                    updated_at?: string | null;
                };
                Relationships: never[];
            };
            documents: {
                Row: {
                    id: string;
                    project_id: string;
                    name: string;
                    description: string | null;
                    slug: string;
                    tags: string[] | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                    version: number;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    embedding: string | null;
                    fts_vector: string | null;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    name: string;
                    description?: string | null;
                    slug: string;
                    tags?: string[] | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    name?: string;
                    description?: string | null;
                    slug?: string;
                    tags?: string[] | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Relationships: never[];
            };
            embedding_cache: {
                Row: {
                    id: string;
                    cache_key: string;
                    embedding: string | null;
                    tokens_used: number;
                    model: string;
                    created_at: string;
                    accessed_at: string;
                    access_count: number;
                };
                Insert: {
                    id?: string;
                    cache_key: string;
                    embedding?: string | null;
                    tokens_used?: number;
                    model?: string;
                    created_at?: string;
                    accessed_at?: string;
                    access_count?: number;
                };
                Update: {
                    id?: string;
                    cache_key?: string;
                    embedding?: string | null;
                    tokens_used?: number;
                    model?: string;
                    created_at?: string;
                    accessed_at?: string;
                    access_count?: number;
                };
                Relationships: never[];
            };
            excalidraw_diagrams: {
                Row: {
                    created_at: string;
                    updated_at: string | null;
                    diagram_data: Json | null;
                    organization_id: string | null;
                    project_id: string | null;
                    created_by: string | null;
                    updated_by: string | null;
                    id: string;
                    thumbnail_url: string | null;
                    name: string | null;
                };
                Insert: {
                    created_at?: string;
                    updated_at?: string | null;
                    diagram_data?: Json | null;
                    organization_id?: string | null;
                    project_id?: string | null;
                    created_by?: string | null;
                    updated_by?: string | null;
                    id?: string;
                    thumbnail_url?: string | null;
                    name?: string | null;
                };
                Update: {
                    created_at?: string;
                    updated_at?: string | null;
                    diagram_data?: Json | null;
                    organization_id?: string | null;
                    project_id?: string | null;
                    created_by?: string | null;
                    updated_by?: string | null;
                    id?: string;
                    thumbnail_url?: string | null;
                    name?: string | null;
                };
                Relationships: never[];
            };
            excalidraw_element_links: {
                Row: {
                    id: string;
                    create_by: string;
                    created_at: string;
                    excalidraw_canvas_id: string;
                    element_id: string | null;
                    requirement_id: string;
                };
                Insert: {
                    id?: string;
                    create_by?: string;
                    created_at?: string;
                    excalidraw_canvas_id?: string;
                    element_id?: string | null;
                    requirement_id?: string;
                };
                Update: {
                    id?: string;
                    create_by?: string;
                    created_at?: string;
                    excalidraw_canvas_id?: string;
                    element_id?: string | null;
                    requirement_id?: string;
                };
                Relationships: never[];
            };
            external_documents: {
                Row: {
                    id: string;
                    organization_id: string;
                    name: string;
                    created_by: string | null;
                    updated_by: string | null;
                    owned_by: string | null;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    url: string | null;
                    type: string | null;
                    size: number | null;
                    gumloop_name: string | null;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    name: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    owned_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    url?: string | null;
                    type?: string | null;
                    size?: number | null;
                    gumloop_name?: string | null;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    name?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    owned_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    url?: string | null;
                    type?: string | null;
                    size?: number | null;
                    gumloop_name?: string | null;
                };
                Relationships: never[];
            };
            mcp_audit_log: {
                Row: {
                    id: number;
                    user_id: string;
                    org_id: string;
                    action: string;
                    resource_type: string;
                    resource_id: string | null;
                    details: string | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    timestamp: string;
                };
                Insert: {
                    id: number;
                    user_id: string;
                    org_id: string;
                    action: string;
                    resource_type: string;
                    resource_id?: string | null;
                    details?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    timestamp?: string;
                };
                Update: {
                    id?: number;
                    user_id?: string;
                    org_id?: string;
                    action?: string;
                    resource_type?: string;
                    resource_id?: string | null;
                    details?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    timestamp?: string;
                };
                Relationships: never[];
            };
            mcp_configurations: {
                Row: {
                    id: string;
                    name: string;
                    type: string;
                    endpoint: string | null;
                    command: string | null;
                    args: string | null;
                    auth_type: string;
                    auth_token: string | null;
                    auth_header: string | null;
                    config: string | null;
                    scope: string;
                    org_id: string | null;
                    user_id: string | null;
                    enabled: boolean;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string;
                    updated_by: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    type: string;
                    endpoint?: string | null;
                    command?: string | null;
                    args?: string | null;
                    auth_type: string;
                    auth_token?: string | null;
                    auth_header?: string | null;
                    config?: string | null;
                    scope: string;
                    org_id?: string | null;
                    user_id?: string | null;
                    enabled?: boolean;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by: string;
                    updated_by: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    type?: string;
                    endpoint?: string | null;
                    command?: string | null;
                    args?: string | null;
                    auth_type?: string;
                    auth_token?: string | null;
                    auth_header?: string | null;
                    config?: string | null;
                    scope?: string;
                    org_id?: string | null;
                    user_id?: string | null;
                    enabled?: boolean;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string;
                    updated_by?: string;
                };
                Relationships: never[];
            };
            mcp_oauth_tokens: {
                Row: {
                    id: string;
                    transaction_id: string;
                    user_id: string | null;
                    organization_id: string | null;
                    mcp_namespace: string;
                    provider_key: string;
                    access_token: string | null;
                    refresh_token: string | null;
                    token_type: string | null;
                    scope: string | null;
                    expires_at: string | null;
                    issued_at: string;
                    upstream_response: Json | null;
                };
                Insert: {
                    id?: string;
                    transaction_id: string;
                    user_id?: string | null;
                    organization_id?: string | null;
                    mcp_namespace: string;
                    provider_key: string;
                    access_token?: string | null;
                    refresh_token?: string | null;
                    token_type?: string | null;
                    scope?: string | null;
                    expires_at?: string | null;
                    issued_at?: string;
                    upstream_response?: Json | null;
                };
                Update: {
                    id?: string;
                    transaction_id?: string;
                    user_id?: string | null;
                    organization_id?: string | null;
                    mcp_namespace?: string;
                    provider_key?: string;
                    access_token?: string | null;
                    refresh_token?: string | null;
                    token_type?: string | null;
                    scope?: string | null;
                    expires_at?: string | null;
                    issued_at?: string;
                    upstream_response?: Json | null;
                };
                Relationships: never[];
            };
            mcp_oauth_transactions: {
                Row: {
                    id: string;
                    user_id: string | null;
                    organization_id: string | null;
                    mcp_namespace: string;
                    provider_key: string;
                    status: string;
                    authorization_url: string | null;
                    code_challenge: string | null;
                    code_verifier: string | null;
                    state: string | null;
                    scopes: string[] | null;
                    upstream_metadata: Json | null;
                    error: Json | null;
                    created_at: string;
                    updated_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    organization_id?: string | null;
                    mcp_namespace: string;
                    provider_key: string;
                    status: string;
                    authorization_url?: string | null;
                    code_challenge?: string | null;
                    code_verifier?: string | null;
                    state?: string | null;
                    scopes?: string[] | null;
                    upstream_metadata?: Json | null;
                    error?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    organization_id?: string | null;
                    mcp_namespace?: string;
                    provider_key?: string;
                    status?: string;
                    authorization_url?: string | null;
                    code_challenge?: string | null;
                    code_verifier?: string | null;
                    state?: string | null;
                    scopes?: string[] | null;
                    upstream_metadata?: Json | null;
                    error?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
                Relationships: never[];
            };
            mcp_profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    description: string | null;
                    servers: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    description?: string | null;
                    servers?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    description?: string | null;
                    servers?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            mcp_proxy_configs: {
                Row: {
                    id: string;
                    server_name: string;
                    server_url: string;
                    auth_type: string;
                    auth_config: Json;
                    proxy_url: string | null;
                    proxy_status: string;
                    created_by: string;
                    organization_id: string | null;
                    created_at: string;
                    updated_at: string;
                    last_used_at: string | null;
                    last_health_check: string | null;
                    health_status: string;
                    health_error: string | null;
                    request_count: number;
                    error_count: number;
                    last_error: string | null;
                    last_error_at: string | null;
                };
                Insert: {
                    id?: string;
                    server_name: string;
                    server_url: string;
                    auth_type: string;
                    auth_config: Json;
                    proxy_url?: string | null;
                    proxy_status?: string;
                    created_by: string;
                    organization_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_used_at?: string | null;
                    last_health_check?: string | null;
                    health_status?: string;
                    health_error?: string | null;
                    request_count?: number;
                    error_count?: number;
                    last_error?: string | null;
                    last_error_at?: string | null;
                };
                Update: {
                    id?: string;
                    server_name?: string;
                    server_url?: string;
                    auth_type?: string;
                    auth_config?: Json;
                    proxy_url?: string | null;
                    proxy_status?: string;
                    created_by?: string;
                    organization_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_used_at?: string | null;
                    last_health_check?: string | null;
                    health_status?: string;
                    health_error?: string | null;
                    request_count?: number;
                    error_count?: number;
                    last_error?: string | null;
                    last_error_at?: string | null;
                };
                Relationships: never[];
            };
            mcp_registry_sync_status: {
                Row: {
                    id: string;
                    sync_started_at: string;
                    sync_completed_at: string | null;
                    sync_status: string;
                    servers_added: number;
                    servers_updated: number;
                    servers_removed: number;
                    servers_failed: number;
                    error_message: string | null;
                    error_details: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    sync_started_at: string;
                    sync_completed_at?: string | null;
                    sync_status: string;
                    servers_added?: number;
                    servers_updated?: number;
                    servers_removed?: number;
                    servers_failed?: number;
                    error_message?: string | null;
                    error_details?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    sync_started_at?: string;
                    sync_completed_at?: string | null;
                    sync_status?: string;
                    servers_added?: number;
                    servers_updated?: number;
                    servers_removed?: number;
                    servers_failed?: number;
                    error_message?: string | null;
                    error_details?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            mcp_server_security_reviews: {
                Row: {
                    id: string;
                    server_id: string;
                    review_date: string;
                    reviewed_by: string;
                    reviewer_email: string | null;
                    status: string;
                    code_review_passed: boolean | null;
                    code_review_notes: string | null;
                    security_scan_passed: boolean | null;
                    security_scan_notes: string | null;
                    security_scan_results: Json | null;
                    auth_review_passed: boolean | null;
                    auth_review_notes: string | null;
                    network_review_passed: boolean | null;
                    network_review_notes: string | null;
                    license_review_passed: boolean | null;
                    license_review_notes: string | null;
                    dependency_review_passed: boolean | null;
                    dependency_review_notes: string | null;
                    risk_level: string | null;
                    notes: string | null;
                    recommendations: string | null;
                    expires_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    server_id: string;
                    review_date?: string;
                    reviewed_by: string;
                    reviewer_email?: string | null;
                    status: string;
                    code_review_passed?: boolean | null;
                    code_review_notes?: string | null;
                    security_scan_passed?: boolean | null;
                    security_scan_notes?: string | null;
                    security_scan_results?: Json | null;
                    auth_review_passed?: boolean | null;
                    auth_review_notes?: string | null;
                    network_review_passed?: boolean | null;
                    network_review_notes?: string | null;
                    license_review_passed?: boolean | null;
                    license_review_notes?: string | null;
                    dependency_review_passed?: boolean | null;
                    dependency_review_notes?: string | null;
                    risk_level?: string | null;
                    notes?: string | null;
                    recommendations?: string | null;
                    expires_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    server_id?: string;
                    review_date?: string;
                    reviewed_by?: string;
                    reviewer_email?: string | null;
                    status?: string;
                    code_review_passed?: boolean | null;
                    code_review_notes?: string | null;
                    security_scan_passed?: boolean | null;
                    security_scan_notes?: string | null;
                    security_scan_results?: Json | null;
                    auth_review_passed?: boolean | null;
                    auth_review_notes?: string | null;
                    network_review_passed?: boolean | null;
                    network_review_notes?: string | null;
                    license_review_passed?: boolean | null;
                    license_review_notes?: string | null;
                    dependency_review_passed?: boolean | null;
                    dependency_review_notes?: string | null;
                    risk_level?: string | null;
                    notes?: string | null;
                    recommendations?: string | null;
                    expires_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            mcp_server_usage_logs: {
                Row: {
                    id: string;
                    user_server_id: string;
                    user_id: string;
                    server_id: string;
                    tool_name: string | null;
                    request_params: Json | null;
                    success: boolean;
                    error_message: string | null;
                    error_code: string | null;
                    duration_ms: number | null;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_server_id: string;
                    user_id: string;
                    server_id: string;
                    tool_name?: string | null;
                    request_params?: Json | null;
                    success: boolean;
                    error_message?: string | null;
                    error_code?: string | null;
                    duration_ms?: number | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_server_id?: string;
                    user_id?: string;
                    server_id?: string;
                    tool_name?: string | null;
                    request_params?: Json | null;
                    success?: boolean;
                    error_message?: string | null;
                    error_code?: string | null;
                    duration_ms?: number | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            mcp_servers: {
                Row: {
                    id: string;
                    namespace: string;
                    name: string;
                    description: string | null;
                    version: string;
                    source: string;
                    tier: string;
                    url: string;
                    transport: string;
                    auth_type: string;
                    auth_config: Json | null;
                    security_review_status: string | null;
                    security_review_date: string | null;
                    security_reviewed_by: string | null;
                    security_review_expires_at: string | null;
                    security_notes: string | null;
                    publisher_verified: boolean;
                    publisher_type: string | null;
                    publisher_namespace: string | null;
                    license: string | null;
                    repository_url: string | null;
                    documentation_url: string | null;
                    homepage_url: string | null;
                    stars: number;
                    downloads: number;
                    install_count: number;
                    active_users: number;
                    category: string | null;
                    tags: string[] | null;
                    enabled: boolean;
                    deprecated: boolean;
                    deprecation_reason: string | null;
                    deprecation_date: string | null;
                    last_synced_at: string | null;
                    sync_source: string | null;
                    created_at: string;
                    updated_at: string;
                    last_updated_at: string | null;
                    created_by: string | null;
                    organization_id: string | null;
                    last_health_check: string | null;
                    health_status: string | null;
                    env: Json | null;
                    scope: string;
                    user_id: string | null;
                    metadata: Json | null;
                    transport_type: string | null;
                    transport_config: Json | null;
                    project_id: string | null;
                };
                Insert: {
                    id?: string;
                    namespace: string;
                    name: string;
                    description?: string | null;
                    version?: string;
                    source: string;
                    tier?: string;
                    url: string;
                    transport: string;
                    auth_type: string;
                    auth_config?: Json | null;
                    security_review_status?: string | null;
                    security_review_date?: string | null;
                    security_reviewed_by?: string | null;
                    security_review_expires_at?: string | null;
                    security_notes?: string | null;
                    publisher_verified?: boolean;
                    publisher_type?: string | null;
                    publisher_namespace?: string | null;
                    license?: string | null;
                    repository_url?: string | null;
                    documentation_url?: string | null;
                    homepage_url?: string | null;
                    stars?: number;
                    downloads?: number;
                    install_count?: number;
                    active_users?: number;
                    category?: string | null;
                    tags?: string[] | null;
                    enabled?: boolean;
                    deprecated?: boolean;
                    deprecation_reason?: string | null;
                    deprecation_date?: string | null;
                    last_synced_at?: string | null;
                    sync_source?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_updated_at?: string | null;
                    created_by?: string | null;
                    organization_id?: string | null;
                    last_health_check?: string | null;
                    health_status?: string | null;
                    env?: Json | null;
                    scope?: string;
                    user_id?: string | null;
                    metadata?: Json | null;
                    transport_type?: string | null;
                    transport_config?: Json | null;
                    project_id?: string | null;
                };
                Update: {
                    id?: string;
                    namespace?: string;
                    name?: string;
                    description?: string | null;
                    version?: string;
                    source?: string;
                    tier?: string;
                    url?: string;
                    transport?: string;
                    auth_type?: string;
                    auth_config?: Json | null;
                    security_review_status?: string | null;
                    security_review_date?: string | null;
                    security_reviewed_by?: string | null;
                    security_review_expires_at?: string | null;
                    security_notes?: string | null;
                    publisher_verified?: boolean;
                    publisher_type?: string | null;
                    publisher_namespace?: string | null;
                    license?: string | null;
                    repository_url?: string | null;
                    documentation_url?: string | null;
                    homepage_url?: string | null;
                    stars?: number;
                    downloads?: number;
                    install_count?: number;
                    active_users?: number;
                    category?: string | null;
                    tags?: string[] | null;
                    enabled?: boolean;
                    deprecated?: boolean;
                    deprecation_reason?: string | null;
                    deprecation_date?: string | null;
                    last_synced_at?: string | null;
                    sync_source?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_updated_at?: string | null;
                    created_by?: string | null;
                    organization_id?: string | null;
                    last_health_check?: string | null;
                    health_status?: string | null;
                    env?: Json | null;
                    scope?: string;
                    user_id?: string | null;
                    metadata?: Json | null;
                    transport_type?: string | null;
                    transport_config?: Json | null;
                    project_id?: string | null;
                };
                Relationships: never[];
            };
            mcp_sessions: {
                Row: {
                    session_id: string;
                    user_id: string;
                    oauth_data: Json;
                    mcp_state: Json | null;
                    created_at: string;
                    updated_at: string;
                    expires_at: string;
                };
                Insert: {
                    session_id: string;
                    user_id: string;
                    oauth_data: Json;
                    mcp_state?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    expires_at: string;
                };
                Update: {
                    session_id?: string;
                    user_id?: string;
                    oauth_data?: Json;
                    mcp_state?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    expires_at?: string;
                };
                Relationships: never[];
            };
            models: {
                Row: {
                    id: string;
                    agent_id: string;
                    name: string;
                    display_name: string | null;
                    description: string | null;
                    provider: string | null;
                    model_id: string | null;
                    enabled: boolean;
                    config: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    agent_id: string;
                    name: string;
                    display_name?: string | null;
                    description?: string | null;
                    provider?: string | null;
                    model_id?: string | null;
                    enabled?: boolean;
                    config?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    agent_id?: string;
                    name?: string;
                    display_name?: string | null;
                    description?: string | null;
                    provider?: string | null;
                    model_id?: string | null;
                    enabled?: boolean;
                    config?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: "invitation" | "mention" | "system";
                    title: string;
                    unread: boolean;
                    message: string | null;
                    metadata: Json | null;
                    read_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: "invitation" | "mention" | "system";
                    title: string;
                    unread?: boolean;
                    message?: string | null;
                    metadata?: Json | null;
                    read_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: "invitation" | "mention" | "system";
                    title?: string;
                    unread?: boolean;
                    message?: string | null;
                    metadata?: Json | null;
                    read_at?: string | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            organization_invitations: {
                Row: {
                    id: string;
                    organization_id: string;
                    email: string;
                    role: "member" | "admin" | "owner" | "super_admin";
                    token: string;
                    status: "pending" | "accepted" | "rejected" | "revoked";
                    created_by: string;
                    updated_by: string;
                    expires_at: string;
                    metadata: Json | null;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    email: string;
                    role?: "member" | "admin" | "owner" | "super_admin";
                    token?: string;
                    status?: "pending" | "accepted" | "rejected" | "revoked";
                    created_by: string;
                    updated_by: string;
                    expires_at?: string;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    email?: string;
                    role?: "member" | "admin" | "owner" | "super_admin";
                    token?: string;
                    status?: "pending" | "accepted" | "rejected" | "revoked";
                    created_by?: string;
                    updated_by?: string;
                    expires_at?: string;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Relationships: never[];
            };
            organization_members: {
                Row: {
                    id: string;
                    organization_id: string;
                    user_id: string;
                    role: "member" | "admin" | "owner" | "super_admin";
                    status: "active" | "inactive";
                    last_active_at: string | null;
                    permissions: Json | null;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    user_id: string;
                    role?: "member" | "admin" | "owner" | "super_admin";
                    status?: "active" | "inactive";
                    last_active_at?: string | null;
                    permissions?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    user_id?: string;
                    role?: "member" | "admin" | "owner" | "super_admin";
                    status?: "active" | "inactive";
                    last_active_at?: string | null;
                    permissions?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    updated_by?: string | null;
                };
                Relationships: never[];
            };
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string | null;
                    type: "personal" | "team" | "enterprise";
                    logo_url: string | null;
                    billing_plan: "free" | "pro" | "enterprise";
                    billing_cycle: "none" | "month" | "year";
                    max_members: number;
                    max_monthly_requests: number;
                    settings: Json | null;
                    metadata: Json | null;
                    member_count: number;
                    storage_used: number;
                    created_by: string;
                    updated_by: string;
                    status: "active" | "inactive";
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    owner_id: string | null;
                    embedding: string | null;
                    fts_vector: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    description?: string | null;
                    type?: "personal" | "team" | "enterprise";
                    logo_url?: string | null;
                    billing_plan?: "free" | "pro" | "enterprise";
                    billing_cycle?: "none" | "month" | "year";
                    max_members?: number;
                    max_monthly_requests?: number;
                    settings?: Json | null;
                    metadata?: Json | null;
                    member_count?: number;
                    storage_used?: number;
                    created_by: string;
                    updated_by: string;
                    status?: "active" | "inactive";
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    owner_id?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    description?: string | null;
                    type?: "personal" | "team" | "enterprise";
                    logo_url?: string | null;
                    billing_plan?: "free" | "pro" | "enterprise";
                    billing_cycle?: "none" | "month" | "year";
                    max_members?: number;
                    max_monthly_requests?: number;
                    settings?: Json | null;
                    metadata?: Json | null;
                    member_count?: number;
                    storage_used?: number;
                    created_by?: string;
                    updated_by?: string;
                    status?: "active" | "inactive";
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    owner_id?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Relationships: never[];
            };
            pg_all_foreign_keys: {
                Row: {
                    fk_schema_name: string | null;
                    fk_table_name: string | null;
                    fk_constraint_name: string | null;
                    fk_table_oid: string | null;
                    fk_columns: string[] | null;
                    pk_schema_name: string | null;
                    pk_table_name: string | null;
                    pk_constraint_name: string | null;
                    pk_table_oid: string | null;
                    pk_index_name: string | null;
                    pk_columns: string[] | null;
                    match_type: string | null;
                    on_delete: string | null;
                    on_update: string | null;
                    is_deferrable: boolean | null;
                    is_deferred: boolean | null;
                };
                Insert: {
                    fk_schema_name?: string | null;
                    fk_table_name?: string | null;
                    fk_constraint_name?: string | null;
                    fk_table_oid?: string | null;
                    fk_columns?: string[] | null;
                    pk_schema_name?: string | null;
                    pk_table_name?: string | null;
                    pk_constraint_name?: string | null;
                    pk_table_oid?: string | null;
                    pk_index_name?: string | null;
                    pk_columns?: string[] | null;
                    match_type?: string | null;
                    on_delete?: string | null;
                    on_update?: string | null;
                    is_deferrable?: boolean | null;
                    is_deferred?: boolean | null;
                };
                Update: {
                    fk_schema_name?: string | null;
                    fk_table_name?: string | null;
                    fk_constraint_name?: string | null;
                    fk_table_oid?: string | null;
                    fk_columns?: string[] | null;
                    pk_schema_name?: string | null;
                    pk_table_name?: string | null;
                    pk_constraint_name?: string | null;
                    pk_table_oid?: string | null;
                    pk_index_name?: string | null;
                    pk_columns?: string[] | null;
                    match_type?: string | null;
                    on_delete?: string | null;
                    on_update?: string | null;
                    is_deferrable?: boolean | null;
                    is_deferred?: boolean | null;
                };
                Relationships: never[];
            };
            platform_admins: {
                Row: {
                    id: string;
                    workos_user_id: string;
                    email: string;
                    name: string | null;
                    added_at: string;
                    added_by: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    workos_user_id: string;
                    email: string;
                    name?: string | null;
                    added_at?: string;
                    added_by?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    workos_user_id?: string;
                    email?: string;
                    name?: string | null;
                    added_at?: string;
                    added_by?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    email: string;
                    personal_organization_id: string | null;
                    current_organization_id: string | null;
                    job_title: string | null;
                    preferences: Json | null;
                    status: "active" | "inactive";
                    last_login_at: string | null;
                    login_count: number;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    pinned_organization_id: string | null;
                    is_approved: boolean;
                    workos_id: string | null;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    email: string;
                    personal_organization_id?: string | null;
                    current_organization_id?: string | null;
                    job_title?: string | null;
                    preferences?: Json | null;
                    status?: "active" | "inactive";
                    last_login_at?: string | null;
                    login_count?: number;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    pinned_organization_id?: string | null;
                    is_approved?: boolean;
                    workos_id?: string | null;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    email?: string;
                    personal_organization_id?: string | null;
                    current_organization_id?: string | null;
                    job_title?: string | null;
                    preferences?: Json | null;
                    status?: "active" | "inactive";
                    last_login_at?: string | null;
                    login_count?: number;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    pinned_organization_id?: string | null;
                    is_approved?: boolean;
                    workos_id?: string | null;
                };
                Relationships: never[];
            };
            project_invitations: {
                Row: {
                    id: string;
                    project_id: string;
                    email: string;
                    token: string;
                    status: "pending" | "accepted" | "rejected" | "revoked";
                    created_by: string;
                    updated_by: string;
                    expires_at: string;
                    metadata: Json | null;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    role: "owner" | "admin" | "maintainer" | "editor" | "viewer";
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    email: string;
                    token?: string;
                    status?: "pending" | "accepted" | "rejected" | "revoked";
                    created_by: string;
                    updated_by: string;
                    expires_at?: string;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    role?: "owner" | "admin" | "maintainer" | "editor" | "viewer";
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    email?: string;
                    token?: string;
                    status?: "pending" | "accepted" | "rejected" | "revoked";
                    created_by?: string;
                    updated_by?: string;
                    expires_at?: string;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    role?: "owner" | "admin" | "maintainer" | "editor" | "viewer";
                };
                Relationships: never[];
            };
            project_members: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string;
                    role: "owner" | "admin" | "maintainer" | "editor" | "viewer";
                    status: "active" | "inactive";
                    permissions: Json | null;
                    last_accessed_at: string | null;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    org_id: string | null;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id: string;
                    role?: "owner" | "admin" | "maintainer" | "editor" | "viewer";
                    status?: "active" | "inactive";
                    permissions?: Json | null;
                    last_accessed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    org_id?: string | null;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    user_id?: string;
                    role?: "owner" | "admin" | "maintainer" | "editor" | "viewer";
                    status?: "active" | "inactive";
                    permissions?: Json | null;
                    last_accessed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    org_id?: string | null;
                };
                Relationships: never[];
            };
            projects: {
                Row: {
                    id: string;
                    organization_id: string;
                    name: string;
                    slug: string;
                    description: string | null;
                    visibility: "private" | "team" | "organization" | "public";
                    status: "active" | "archived" | "draft" | "deleted";
                    settings: Json | null;
                    star_count: number;
                    tags: string[] | null;
                    metadata: Json | null;
                    created_by: string;
                    updated_by: string;
                    owned_by: string;
                    version: number;
                    created_at: string;
                    updated_at: string;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    embedding: string | null;
                    fts_vector: string | null;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    name: string;
                    slug: string;
                    description?: string | null;
                    visibility?: "private" | "team" | "organization" | "public";
                    status?: "active" | "archived" | "draft" | "deleted";
                    settings?: Json | null;
                    star_count?: number;
                    tags?: string[] | null;
                    metadata?: Json | null;
                    created_by: string;
                    updated_by: string;
                    owned_by: string;
                    version?: number;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    name?: string;
                    slug?: string;
                    description?: string | null;
                    visibility?: "private" | "team" | "organization" | "public";
                    status?: "active" | "archived" | "draft" | "deleted";
                    settings?: Json | null;
                    star_count?: number;
                    tags?: string[] | null;
                    metadata?: Json | null;
                    created_by?: string;
                    updated_by?: string;
                    owned_by?: string;
                    version?: number;
                    created_at?: string;
                    updated_at?: string;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Relationships: never[];
            };
            properties: {
                Row: {
                    id: string;
                    org_id: string;
                    project_id: string | null;
                    document_id: string | null;
                    name: string;
                    property_type: string;
                    options: Json | null;
                    is_base: boolean;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                    scope: string | null;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    project_id?: string | null;
                    document_id?: string | null;
                    name: string;
                    property_type: string;
                    options?: Json | null;
                    is_base?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    scope?: string | null;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Update: {
                    id?: string;
                    org_id?: string;
                    project_id?: string | null;
                    document_id?: string | null;
                    name?: string;
                    property_type?: string;
                    options?: Json | null;
                    is_base?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    scope?: string | null;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Relationships: never[];
            };
            rag_embeddings: {
                Row: {
                    id: string;
                    entity_id: string;
                    entity_type: string;
                    embedding: string;
                    content_hash: string | null;
                    quality_score: number;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    entity_id: string;
                    entity_type: string;
                    embedding: string;
                    content_hash?: string | null;
                    quality_score?: number;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    entity_id?: string;
                    entity_type?: string;
                    embedding?: string;
                    content_hash?: string | null;
                    quality_score?: number;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            rag_search_analytics: {
                Row: {
                    id: string;
                    user_id: string | null;
                    organization_id: string | null;
                    query_text: string;
                    query_hash: string;
                    search_type: string;
                    execution_time_ms: number;
                    result_count: number;
                    cache_hit: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    organization_id?: string | null;
                    query_text: string;
                    query_hash: string;
                    search_type: string;
                    execution_time_ms: number;
                    result_count: number;
                    cache_hit?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    organization_id?: string | null;
                    query_text?: string;
                    query_hash?: string;
                    search_type?: string;
                    execution_time_ms?: number;
                    result_count?: number;
                    cache_hit?: boolean;
                    created_at?: string;
                };
                Relationships: never[];
            };
            react_flow_diagrams: {
                Row: {
                    id: string;
                    project_id: string;
                    name: string;
                    description: string | null;
                    nodes: Json;
                    edges: Json;
                    viewport: Json | null;
                    diagram_type: string;
                    layout_algorithm: string;
                    theme: string;
                    settings: Json | null;
                    metadata: Json | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    name?: string;
                    description?: string | null;
                    nodes: Json;
                    edges: Json;
                    viewport?: Json | null;
                    diagram_type?: string;
                    layout_algorithm?: string;
                    theme?: string;
                    settings?: Json | null;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    name?: string;
                    description?: string | null;
                    nodes?: Json;
                    edges?: Json;
                    viewport?: Json | null;
                    diagram_type?: string;
                    layout_algorithm?: string;
                    theme?: string;
                    settings?: Json | null;
                    metadata?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                };
                Relationships: never[];
            };
            requirement_tests: {
                Row: {
                    id: string;
                    requirement_id: string;
                    test_id: string;
                    execution_status: "not_executed" | "in_progress" | "passed" | "failed" | "blocked" | "skipped";
                    result_notes: string | null;
                    executed_at: string | null;
                    executed_by: string | null;
                    execution_environment: string | null;
                    execution_version: string | null;
                    defects: Json | null;
                    evidence_artifacts: Json | null;
                    created_at: string;
                    updated_at: string;
                    external_test_id: string | null;
                    external_req_id: string | null;
                };
                Insert: {
                    id?: string;
                    requirement_id: string;
                    test_id: string;
                    execution_status?: "not_executed" | "in_progress" | "passed" | "failed" | "blocked" | "skipped";
                    result_notes?: string | null;
                    executed_at?: string | null;
                    executed_by?: string | null;
                    execution_environment?: string | null;
                    execution_version?: string | null;
                    defects?: Json | null;
                    evidence_artifacts?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    external_test_id?: string | null;
                    external_req_id?: string | null;
                };
                Update: {
                    id?: string;
                    requirement_id?: string;
                    test_id?: string;
                    execution_status?: "not_executed" | "in_progress" | "passed" | "failed" | "blocked" | "skipped";
                    result_notes?: string | null;
                    executed_at?: string | null;
                    executed_by?: string | null;
                    execution_environment?: string | null;
                    execution_version?: string | null;
                    defects?: Json | null;
                    evidence_artifacts?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    external_test_id?: string | null;
                    external_req_id?: string | null;
                };
                Relationships: never[];
            };
            requirements: {
                Row: {
                    id: string;
                    document_id: string;
                    block_id: string;
                    external_id: string | null;
                    name: string;
                    description: string | null;
                    status: "active" | "archived" | "draft" | "deleted" | "in_review" | "in_progress" | "approved" | "rejected";
                    format: "incose" | "ears" | "other";
                    priority: "low" | "medium" | "high" | "critical";
                    level: "component" | "system" | "subsystem";
                    tags: string[] | null;
                    original_requirement: string | null;
                    enchanced_requirement: string | null;
                    ai_analysis: Json | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                    version: number;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    properties: Json | null;
                    position: number;
                    type: string | null;
                    embedding: string | null;
                    fts_vector: string | null;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    block_id: string;
                    external_id?: string | null;
                    name: string;
                    description?: string | null;
                    status?: "active" | "archived" | "draft" | "deleted" | "in_review" | "in_progress" | "approved" | "rejected";
                    format?: "incose" | "ears" | "other";
                    priority?: "low" | "medium" | "high" | "critical";
                    level?: "component" | "system" | "subsystem";
                    tags?: string[] | null;
                    original_requirement?: string | null;
                    enchanced_requirement?: string | null;
                    ai_analysis?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    properties?: Json | null;
                    position: number;
                    type?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    block_id?: string;
                    external_id?: string | null;
                    name?: string;
                    description?: string | null;
                    status?: "active" | "archived" | "draft" | "deleted" | "in_review" | "in_progress" | "approved" | "rejected";
                    format?: "incose" | "ears" | "other";
                    priority?: "low" | "medium" | "high" | "critical";
                    level?: "component" | "system" | "subsystem";
                    tags?: string[] | null;
                    original_requirement?: string | null;
                    enchanced_requirement?: string | null;
                    ai_analysis?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    properties?: Json | null;
                    position?: number;
                    type?: string | null;
                    embedding?: string | null;
                    fts_vector?: string | null;
                };
                Relationships: never[];
            };
            requirements_closure: {
                Row: {
                    ancestor_id: string;
                    descendant_id: string;
                    depth: number;
                    created_at: string;
                    created_by: string;
                    updated_at: string | null;
                    updated_by: string | null;
                };
                Insert: {
                    ancestor_id: string;
                    descendant_id: string;
                    depth: number;
                    created_at?: string;
                    created_by: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Update: {
                    ancestor_id?: string;
                    descendant_id?: string;
                    depth?: number;
                    created_at?: string;
                    created_by?: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                };
                Relationships: never[];
            };
            signup_requests: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string;
                    message: string | null;
                    status: string;
                    created_at: string;
                    updated_at: string;
                    approved_at: string | null;
                    denied_at: string | null;
                    approved_by: string | null;
                    denied_by: string | null;
                    denial_reason: string | null;
                };
                Insert: {
                    id?: string;
                    email: string;
                    full_name: string;
                    message?: string | null;
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                    approved_at?: string | null;
                    denied_at?: string | null;
                    approved_by?: string | null;
                    denied_by?: string | null;
                    denial_reason?: string | null;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string;
                    message?: string | null;
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                    approved_at?: string | null;
                    denied_at?: string | null;
                    approved_by?: string | null;
                    denied_by?: string | null;
                    denial_reason?: string | null;
                };
                Relationships: never[];
            };
            stripe_customers: {
                Row: {
                    id: string;
                    organization_id: string | null;
                    stripe_customer_id: string | null;
                    stripe_subscription_id: string | null;
                    subscription_status: "active" | "inactive" | "trialing" | "past_due" | "canceled" | "paused";
                    price_id: string | null;
                    current_period_start: string | null;
                    current_period_end: string | null;
                    cancel_at_period_end: boolean;
                    payment_method_last4: string | null;
                    payment_method_brand: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    organization_id?: string | null;
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    subscription_status: "active" | "inactive" | "trialing" | "past_due" | "canceled" | "paused";
                    price_id?: string | null;
                    current_period_start?: string | null;
                    current_period_end?: string | null;
                    cancel_at_period_end?: boolean;
                    payment_method_last4?: string | null;
                    payment_method_brand?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    organization_id?: string | null;
                    stripe_customer_id?: string | null;
                    stripe_subscription_id?: string | null;
                    subscription_status?: "active" | "inactive" | "trialing" | "past_due" | "canceled" | "paused";
                    price_id?: string | null;
                    current_period_start?: string | null;
                    current_period_end?: string | null;
                    cancel_at_period_end?: boolean;
                    payment_method_last4?: string | null;
                    payment_method_brand?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            system_prompts: {
                Row: {
                    id: string;
                    scope: string;
                    organization_id: string | null;
                    user_id: string | null;
                    content: string;
                    priority: number;
                    template: string | null;
                    enabled: boolean;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    is_public: boolean;
                    tags: string[] | null;
                    variables: Json | null;
                    name: string;
                    description: string | null;
                    is_default: boolean;
                    updated_by: string | null;
                    version: number;
                };
                Insert: {
                    id?: string;
                    scope: string;
                    organization_id?: string | null;
                    user_id?: string | null;
                    content: string;
                    priority?: number;
                    template?: string | null;
                    enabled?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    is_public?: boolean;
                    tags?: string[] | null;
                    variables?: Json | null;
                    name: string;
                    description?: string | null;
                    is_default?: boolean;
                    updated_by?: string | null;
                    version?: number;
                };
                Update: {
                    id?: string;
                    scope?: string;
                    organization_id?: string | null;
                    user_id?: string | null;
                    content?: string;
                    priority?: number;
                    template?: string | null;
                    enabled?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    is_public?: boolean;
                    tags?: string[] | null;
                    variables?: Json | null;
                    name?: string;
                    description?: string | null;
                    is_default?: boolean;
                    updated_by?: string | null;
                    version?: number;
                };
                Relationships: never[];
            };
            table_rows: {
                Row: {
                    id: string;
                    document_id: string;
                    block_id: string;
                    row_data: Json | null;
                    position: number;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                    version: number;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    block_id: string;
                    row_data?: Json | null;
                    position?: number;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    block_id?: string;
                    row_data?: Json | null;
                    position?: number;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Relationships: never[];
            };
            tap_funky: {
                Row: {
                    oid: string | null;
                    schema: string | null;
                    name: string | null;
                    owner: string | null;
                    args: string | null;
                    returns: string | null;
                    langoid: string | null;
                    is_strict: boolean | null;
                    kind: string | null;
                    is_definer: boolean | null;
                    returns_set: boolean | null;
                    volatility: string | null;
                    is_visible: boolean | null;
                };
                Insert: {
                    oid?: string | null;
                    schema?: string | null;
                    name?: string | null;
                    owner?: string | null;
                    args?: string | null;
                    returns?: string | null;
                    langoid?: string | null;
                    is_strict?: boolean | null;
                    kind?: string | null;
                    is_definer?: boolean | null;
                    returns_set?: boolean | null;
                    volatility?: string | null;
                    is_visible?: boolean | null;
                };
                Update: {
                    oid?: string | null;
                    schema?: string | null;
                    name?: string | null;
                    owner?: string | null;
                    args?: string | null;
                    returns?: string | null;
                    langoid?: string | null;
                    is_strict?: boolean | null;
                    kind?: string | null;
                    is_definer?: boolean | null;
                    returns_set?: boolean | null;
                    volatility?: string | null;
                    is_visible?: boolean | null;
                };
                Relationships: never[];
            };
            test_matrix_views: {
                Row: {
                    id: string;
                    name: string;
                    project_id: string;
                    configuration: Json;
                    created_at: string;
                    updated_at: string;
                    created_by: string;
                    updated_by: string;
                    is_active: boolean;
                    is_default: boolean;
                };
                Insert: {
                    id?: string;
                    name: string;
                    project_id: string;
                    configuration: Json;
                    created_at?: string;
                    updated_at?: string;
                    created_by: string;
                    updated_by: string;
                    is_active?: boolean;
                    is_default?: boolean;
                };
                Update: {
                    id?: string;
                    name?: string;
                    project_id?: string;
                    configuration?: Json;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string;
                    updated_by?: string;
                    is_active?: boolean;
                    is_default?: boolean;
                };
                Relationships: never[];
            };
            test_req: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    test_type: "unit" | "integration" | "system" | "acceptance" | "performance" | "security" | "usability" | "other";
                    priority: "critical" | "high" | "medium" | "low";
                    status: "draft" | "ready" | "in_progress" | "blocked" | "completed" | "obsolete";
                    method: "manual" | "automated" | "hybrid";
                    result: string;
                    expected_results: string | null;
                    preconditions: string | null;
                    test_steps: Json | null;
                    created_by: string | null;
                    created_at: string;
                    updated_by: string | null;
                    updated_at: string;
                    estimated_duration: string | null;
                    category: string[] | null;
                    test_environment: string | null;
                    attachments: Json | null;
                    version: string | null;
                    is_active: boolean;
                    project_id: string | null;
                    test_id: string | null;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                };
                Insert: {
                    id?: string;
                    title: string;
                    description?: string | null;
                    test_type?: "unit" | "integration" | "system" | "acceptance" | "performance" | "security" | "usability" | "other";
                    priority?: "critical" | "high" | "medium" | "low";
                    status?: "draft" | "ready" | "in_progress" | "blocked" | "completed" | "obsolete";
                    method?: "manual" | "automated" | "hybrid";
                    result?: string;
                    expected_results?: string | null;
                    preconditions?: string | null;
                    test_steps?: Json | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_by?: string | null;
                    updated_at?: string;
                    estimated_duration?: string | null;
                    category?: string[] | null;
                    test_environment?: string | null;
                    attachments?: Json | null;
                    version?: string | null;
                    is_active?: boolean;
                    project_id?: string | null;
                    test_id?: string | null;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Update: {
                    id?: string;
                    title?: string;
                    description?: string | null;
                    test_type?: "unit" | "integration" | "system" | "acceptance" | "performance" | "security" | "usability" | "other";
                    priority?: "critical" | "high" | "medium" | "low";
                    status?: "draft" | "ready" | "in_progress" | "blocked" | "completed" | "obsolete";
                    method?: "manual" | "automated" | "hybrid";
                    result?: string;
                    expected_results?: string | null;
                    preconditions?: string | null;
                    test_steps?: Json | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_by?: string | null;
                    updated_at?: string;
                    estimated_duration?: string | null;
                    category?: string[] | null;
                    test_environment?: string | null;
                    attachments?: Json | null;
                    version?: string | null;
                    is_active?: boolean;
                    project_id?: string | null;
                    test_id?: string | null;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Relationships: never[];
            };
            trace_links: {
                Row: {
                    id: string;
                    source_id: string;
                    target_id: string;
                    source_type: "document" | "requirement";
                    target_type: "document" | "requirement";
                    link_type: "derives_from" | "implements" | "relates_to" | "conflicts_with" | "is_related_to" | "parent_of" | "child_of";
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                    created_by: string | null;
                    updated_by: string | null;
                    version: number;
                    is_deleted: boolean;
                    deleted_at: string | null;
                    deleted_by: string | null;
                };
                Insert: {
                    id?: string;
                    source_id: string;
                    target_id: string;
                    source_type: "document" | "requirement";
                    target_type: "document" | "requirement";
                    link_type: "derives_from" | "implements" | "relates_to" | "conflicts_with" | "is_related_to" | "parent_of" | "child_of";
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Update: {
                    id?: string;
                    source_id?: string;
                    target_id?: string;
                    source_type?: "document" | "requirement";
                    target_type?: "document" | "requirement";
                    link_type?: "derives_from" | "implements" | "relates_to" | "conflicts_with" | "is_related_to" | "parent_of" | "child_of";
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    created_by?: string | null;
                    updated_by?: string | null;
                    version?: number;
                    is_deleted?: boolean;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                };
                Relationships: never[];
            };
            usage_logs: {
                Row: {
                    id: string;
                    organization_id: string;
                    user_id: string;
                    feature: string;
                    quantity: number;
                    unit_type: string;
                    metadata: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    user_id: string;
                    feature: string;
                    quantity: number;
                    unit_type: string;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    user_id?: string;
                    feature?: string;
                    quantity?: number;
                    unit_type?: string;
                    metadata?: Json | null;
                    created_at?: string;
                };
                Relationships: never[];
            };
            user_mcp_servers: {
                Row: {
                    id: string;
                    user_id: string;
                    server_id: string;
                    organization_id: string | null;
                    enabled: boolean;
                    custom_config: Json | null;
                    auth_token_encrypted: string | null;
                    oauth_tokens_encrypted: string | null;
                    last_used_at: string | null;
                    usage_count: number;
                    error_count: number;
                    last_error: string | null;
                    last_error_at: string | null;
                    installed_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    server_id: string;
                    organization_id?: string | null;
                    enabled?: boolean;
                    custom_config?: Json | null;
                    auth_token_encrypted?: string | null;
                    oauth_tokens_encrypted?: string | null;
                    last_used_at?: string | null;
                    usage_count?: number;
                    error_count?: number;
                    last_error?: string | null;
                    last_error_at?: string | null;
                    installed_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    server_id?: string;
                    organization_id?: string | null;
                    enabled?: boolean;
                    custom_config?: Json | null;
                    auth_token_encrypted?: string | null;
                    oauth_tokens_encrypted?: string | null;
                    last_used_at?: string | null;
                    usage_count?: number;
                    error_count?: number;
                    last_error?: string | null;
                    last_error_at?: string | null;
                    installed_at?: string;
                    updated_at?: string;
                };
                Relationships: never[];
            };
            user_roles: {
                Row: {
                    id: string;
                    user_id: string;
                    admin_role: "member" | "admin" | "owner" | "super_admin" | null;
                    created_at: string;
                    updated_at: string;
                    project_id: string | null;
                    project_role: "owner" | "admin" | "maintainer" | "editor" | "viewer" | null;
                    document_role: "owner" | "admin" | "maintainer" | "editor" | "viewer" | null;
                    org_id: string | null;
                    document_id: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    admin_role?: "member" | "admin" | "owner" | "super_admin" | null;
                    created_at?: string;
                    updated_at?: string;
                    project_id?: string | null;
                    project_role?: "owner" | "admin" | "maintainer" | "editor" | "viewer" | null;
                    document_role?: "owner" | "admin" | "maintainer" | "editor" | "viewer" | null;
                    org_id?: string | null;
                    document_id?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    admin_role?: "member" | "admin" | "owner" | "super_admin" | null;
                    created_at?: string;
                    updated_at?: string;
                    project_id?: string | null;
                    project_role?: "owner" | "admin" | "maintainer" | "editor" | "viewer" | null;
                    document_role?: "owner" | "admin" | "maintainer" | "editor" | "viewer" | null;
                    org_id?: string | null;
                    document_id?: string | null;
                };
                Relationships: never[];
            };
            v_agent_status: {
                Row: {
                    id: string | null;
                    name: string | null;
                    type: string | null;
                    enabled: boolean | null;
                    health_status: string | null;
                    last_check: string | null;
                    consecutive_failures: number | null;
                    model_count: number | null;
                };
                Insert: {
                    id?: string | null;
                    name?: string | null;
                    type?: string | null;
                    enabled?: boolean | null;
                    health_status?: string | null;
                    last_check?: string | null;
                    consecutive_failures?: number | null;
                    model_count?: number | null;
                };
                Update: {
                    id?: string | null;
                    name?: string | null;
                    type?: string | null;
                    enabled?: boolean | null;
                    health_status?: string | null;
                    last_check?: string | null;
                    consecutive_failures?: number | null;
                    model_count?: number | null;
                };
                Relationships: never[];
            };
            v_recent_sessions: {
                Row: {
                    id: string | null;
                    user_id: string | null;
                    org_id: string | null;
                    title: string | null;
                    model_name: string | null;
                    agent_name: string | null;
                    created_at: string | null;
                    updated_at: string | null;
                    message_count: number | null;
                    last_message_at: string | null;
                };
                Insert: {
                    id?: string | null;
                    user_id?: string | null;
                    org_id?: string | null;
                    title?: string | null;
                    model_name?: string | null;
                    agent_name?: string | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                    message_count?: number | null;
                    last_message_at?: string | null;
                };
                Update: {
                    id?: string | null;
                    user_id?: string | null;
                    org_id?: string | null;
                    title?: string | null;
                    model_name?: string | null;
                    agent_name?: string | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                    message_count?: number | null;
                    last_message_at?: string | null;
                };
                Relationships: never[];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
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

type DatabaseSchemaNames = Exclude<keyof Database, '__InternalSupabase'>;
type DefaultSchema = Database[Extract<DatabaseSchemaNames, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: DatabaseSchemaNames },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: DatabaseSchemaNames;
    }
        ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: DatabaseSchemaNames }
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
        | { schema: DatabaseSchemaNames },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: DatabaseSchemaNames;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: DatabaseSchemaNames }
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
        | { schema: DatabaseSchemaNames },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: DatabaseSchemaNames;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: DatabaseSchemaNames }
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
        | { schema: DatabaseSchemaNames },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: DatabaseSchemaNames;
    }
        ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: DatabaseSchemaNames }
    ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: DatabaseSchemaNames },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: DatabaseSchemaNames;
    }
        ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: DatabaseSchemaNames }
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
