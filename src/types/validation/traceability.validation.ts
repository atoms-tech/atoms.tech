import { z } from 'zod';

import {
    Assignment,
    AssignmentRole,
    AuditLog,
    BillingCache,
    EntityType,
    Json,
    Notification,
    RequirementStatus,
    TraceLink,
    TraceLinkType,
    UserRole,
    UserRoleType,
} from '@/types';

export const TraceLinkSchema = z.object({
    id: z.string(),
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    description: z.string().nullable(),
    is_deleted: z.boolean().nullable(),
    link_type: z.enum([
        'derives_from',
        'implements',
        'relates_to',
        'conflicts_with',
        'is_related_to',
        'parent_of',
        'child_of',
    ]) as z.ZodType<TraceLinkType>,
    source_id: z.string(),
    source_type: z.enum(['document', 'requirement']) as z.ZodType<EntityType>,
    target_id: z.string(),
    target_type: z.enum(['document', 'requirement']) as z.ZodType<EntityType>,
    updated_at: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number(),
}) satisfies z.ZodType<TraceLink>;

export const AssignmentSchema = z.object({
    id: z.string(),
    assignee_id: z.string(),
    comment: z.string().nullable(),
    completed_at: z.string().nullable(),
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    due_date: z.string().nullable(),
    entity_id: z.string(),
    entity_type: z.enum(['document', 'requirement']) as z.ZodType<EntityType>,
    is_deleted: z.boolean().nullable(),
    role: z.enum([
        'assignee',
        'reviewer',
        'approver',
    ]) as z.ZodType<AssignmentRole>,
    status: z.enum([
        'active',
        'archived',
        'draft',
        'deleted',
        'pending',
        'in_progress',
        'approved',
        'rejected',
    ]) as z.ZodType<RequirementStatus>,
    updated_at: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number(),
}) satisfies z.ZodType<Assignment>;

export const AuditLogSchema = z.object({
    id: z.string(),
    action: z.string(),
    actor_id: z.string(),
    created_at: z.string(),
    entity_id: z.string(),
    entity_type: z.string(),
    metadata: z.any().nullable() as z.ZodType<Json>,
    new_data: z.any().nullable() as z.ZodType<Json>,
    old_data: z.any().nullable() as z.ZodType<Json>,
}) satisfies z.ZodType<AuditLog>;

export const BillingCacheSchema = z.object({
    organization_id: z.string(),
    billing_status: z.any() as z.ZodType<Json>,
    current_period_usage: z.any() as z.ZodType<Json>,
    period_end: z.string(),
    period_start: z.string(),
    synced_at: z.string(),
}) satisfies z.ZodType<BillingCache>;

export const NotificationSchema = z.object({
    id: z.string(),
    created_at: z.string().nullable(),
    message: z.string().nullable(),
    metadata: z.any().nullable() as z.ZodType<Json>,
    read_at: z.string().nullable(),
    title: z.string(),
    type: z.enum(['invitation', 'mention', 'system']),
    unread: z.boolean().nullable(),
    user_id: z.string(),
}) satisfies z.ZodType<Notification>;

export const UserRoleSchema = z.object({
    id: z.string(),
    created_at: z.string(),
    role: z.enum([
        'member',
        'admin',
        'owner',
        'super_admin',
    ]) as z.ZodType<UserRoleType>,
    updated_at: z.string(),
    user_id: z.string(),
}) satisfies z.ZodType<UserRole>;
