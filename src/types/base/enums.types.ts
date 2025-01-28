// src/types/base/enums.ts
export const EntityType = {
    document: 'document',
    requirement: 'requirement',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const AssignmentRole = {
    assignee: 'assignee',
    reviewer: 'reviewer',
    approver: 'approver',
} as const;
export type AssignmentRole =
    (typeof AssignmentRole)[keyof typeof AssignmentRole];

export const BillingPlan = {
    free: 'free',
    pro: 'pro',
    enterprise: 'enterprise',
} as const;
export type BillingPlan = (typeof BillingPlan)[keyof typeof BillingPlan];

export const InvitationStatus = {
    pending: 'pending',
    accepted: 'accepted',
    rejected: 'rejected',
    revoked: 'revoked',
} as const;
export type InvitationStatus =
    (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const NotificationType = {
    invitation: 'invitation',
    mention: 'mention',
    system: 'system',
} as const;
export type NotificationType =
    (typeof NotificationType)[keyof typeof NotificationType];

export const OrganizationType = {
    personal: 'personal',
    team: 'team',
} as const;
export type OrganizationType =
    (typeof OrganizationType)[keyof typeof OrganizationType];

export const PricingPlanInterval = {
    none: 'none',
    month: 'month',
    year: 'year',
} as const;
export type PricingPlanInterval =
    (typeof PricingPlanInterval)[keyof typeof PricingPlanInterval];

export const ProjectRole = {
    owner: 'owner',
    admin: 'admin',
    maintainer: 'maintainer',
    editor: 'editor',
    viewer: 'viewer',
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const ProjectStatus = {
    active: 'active',
    archived: 'archived',
    draft: 'draft',
    deleted: 'deleted',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const PropertyType = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'date',
    url: 'url',
    array: 'array',
    enum: 'enum',
    entity_reference: 'entity_reference',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const RequirementFormat = {
    incose: 'incose',
    ears: 'ears',
    other: 'other',
} as const;
export type RequirementFormat =
    (typeof RequirementFormat)[keyof typeof RequirementFormat];

export const RequirementLevel = {
    component: 'component',
    system: 'system',
    subsystem: 'subsystem',
} as const;
export type RequirementLevel =
    (typeof RequirementLevel)[keyof typeof RequirementLevel];

export const RequirementPriority = {
    low: 'low',
    medium: 'medium',
    high: 'high',
} as const;
export type RequirementPriority =
    (typeof RequirementPriority)[keyof typeof RequirementPriority];

export const RequirementStatus = {
    active: 'active',
    archived: 'archived',
    draft: 'draft',
    deleted: 'deleted',
    pending: 'pending',
    in_progress: 'in_progress',
    approved: 'approved',
    rejected: 'rejected',
} as const;
export type RequirementStatus =
    (typeof RequirementStatus)[keyof typeof RequirementStatus];

export const SubscriptionStatus = {
    active: 'active',
    inactive: 'inactive',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    paused: 'paused',
} as const;
export type SubscriptionStatus =
    (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const TraceLinkType = {
    derives_from: 'derives_from',
    implements: 'implements',
    relates_to: 'relates_to',
    conflicts_with: 'conflicts_with',
    is_related_to: 'is_related_to',
    parent_of: 'parent_of',
    child_of: 'child_of',
} as const;
export type TraceLinkType = (typeof TraceLinkType)[keyof typeof TraceLinkType];

export const UserRoleType = {
    member: 'member',
    admin: 'admin',
    owner: 'owner',
    super_admin: 'super_admin',
} as const;
export type UserRoleType = (typeof UserRoleType)[keyof typeof UserRoleType];

export const UserStatus = {
    active: 'active',
    inactive: 'inactive',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const Visibility = {
    private: 'private',
    team: 'team',
    organization: 'organization',
    public: 'public',
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];
