import { Database } from './database.types';

export type EEntityType = Database['public']['Enums']['entity_type'];
export const EntityType = {
    document: 'document',
    requirement: 'requirement',
} as const;

export type EAssignmentRole = Database['public']['Enums']['assignment_role'];
export const AssignmentRole = {
    assignee: 'assignee',
    reviewer: 'reviewer',
    approver: 'approver',
} as const;

export type EBillingPlan = Database['public']['Enums']['billing_plan'];
export const BillingPlan = {
    free: 'free',
    pro: 'pro',
    enterprise: 'enterprise',
} as const;

export type EInvitationStatus =
    Database['public']['Enums']['invitation_status'];
export const InvitationStatus = {
    pending: 'pending',
    accepted: 'accepted',
    rejected: 'rejected',
    revoked: 'revoked',
} as const;

export type ENotificationType =
    Database['public']['Enums']['notification_type'];
export const NotificationType = {
    invitation: 'invitation',
    mention: 'mention',
    system: 'system',
} as const;

export type EOrganizationType =
    Database['public']['Enums']['organization_type'];
export const OrganizationType = {
    personal: 'personal',
    team: 'team',
    enterprise: 'enterprise',
} as const;

export type EPricingPlanInterval =
    Database['public']['Enums']['pricing_plan_interval'];
export const PricingPlanInterval = {
    none: 'none',
    month: 'month',
    year: 'year',
} as const;

export type EProjectStatus = Database['public']['Enums']['project_status'];
export const ProjectStatus = {
    active: 'active',
    archived: 'archived',
    draft: 'draft',
    deleted: 'deleted',
} as const;

export type EPropertyType = Database['public']['Enums']['property_type'];
export const PropertyType = {
    text: 'text',
    number: 'number',
    boolean: 'boolean',
    date: 'date',
    url: 'url',
    array: 'array',
    enum: 'enum',
    entity_reference: 'entity_reference',
    select: 'select',
    multi_select: 'multi_select',
    file: 'file',
} as const;

export type ERequirementFormat =
    Database['public']['Enums']['requirement_format'];
export const RequirementFormat = {
    incose: 'incose',
    ears: 'ears',
    other: 'other',
} as const;

export type ERequirementLevel =
    Database['public']['Enums']['requirement_level'];
export const RequirementLevel = {
    component: 'component',
    system: 'system',
    subsystem: 'subsystem',
} as const;

export type ERequirementPriority =
    Database['public']['Enums']['requirement_priority'];
export const RequirementPriority = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
} as const;

export type ERequirementStatus =
    Database['public']['Enums']['requirement_status'];
export const RequirementStatus = {
    active: 'active',
    archived: 'archived',
    draft: 'draft',
    deleted: 'deleted',
    in_review: 'in_review',
    in_progress: 'in_progress',
    approved: 'approved',
    rejected: 'rejected',
} as const;

export type ESubscriptionStatus =
    Database['public']['Enums']['subscription_status'];
export const SubscriptionStatus = {
    active: 'active',
    inactive: 'inactive',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    paused: 'paused',
} as const;

export type ETraceLinkType = Database['public']['Enums']['trace_link_type'];
export const TraceLinkType = {
    derives_from: 'derives_from',
    implements: 'implements',
    relates_to: 'relates_to',
    conflicts_with: 'conflicts_with',
    is_related_to: 'is_related_to',
    parent_of: 'parent_of',
    child_of: 'child_of',
} as const;

export type EUserStatus = Database['public']['Enums']['user_status'];
export const UserStatus = {
    active: 'active',
    inactive: 'inactive',
} as const;

export type EVisibility = Database['public']['Enums']['visibility'];
export const Visibility = {
    private: 'private',
    team: 'team',
    organization: 'organization',
    public: 'public',
} as const;
