import { Json } from './database.types';
import {
    AssignmentRole,
    EntityType,
    NotificationType,
    RequirementStatus,
    TraceLinkType,
    UserRoleType,
} from './enums.types';

export type TraceLink = {
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    description: string | null;
    id: string;
    is_deleted: boolean | null;
    link_type: TraceLinkType;
    source_id: string;
    source_type: EntityType;
    target_id: string;
    target_type: EntityType;
    updated_at: string | null;
    updated_by: string | null;
    version: number;
};

export type Assignment = {
    id: string;
    assignee_id: string;
    comment: string | null;
    completed_at: string | null;
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    due_date: string | null;
    entity_id: string;
    entity_type: EntityType;
    is_deleted: boolean | null;
    role: AssignmentRole;
    status: RequirementStatus;
    updated_at: string | null;
    updated_by: string | null;
    version: number;
};

export type AuditLog = {
    id: string;
    action: string;
    actor_id: string;
    created_at: string;
    entity_id: string;
    entity_type: string;
    metadata: Json | null;
    new_data: Json | null;
    old_data: Json | null;
};

export type BillingCache = {
    organization_id: string;
    billing_status: Json;
    current_period_usage: Json;
    period_end: string;
    period_start: string;
    synced_at: string;
};

export type Notification = {
    id: string;
    created_at: string | null;
    message: string | null;
    metadata: Json | null;
    read_at: string | null;
    title: string;
    type: NotificationType;
    unread: boolean | null;
    user_id: string;
};

export type UserRole = {
    id: string;
    created_at: string;
    role: UserRoleType;
    updated_at: string;
    user_id: string;
};
