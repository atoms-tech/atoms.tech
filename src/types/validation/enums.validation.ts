import { z } from 'zod';

import {
    AssignmentRole,
    EntityType,
    NotificationType,
    OrganizationType,
    PricingPlanInterval,
    ProjectRole,
    ProjectStatus,
    PropertyType,
    RequirementFormat,
    RequirementLevel,
    RequirementPriority,
    RequirementStatus,
    UserRoleType,
} from '@/types/base/enums.types';

export const AssignmentRoleSchema = z.enum([
    'assignee',
    'reviewer',
    'approver',
]) as z.ZodType<AssignmentRole>;
export const RequirementStatusSchema = z.enum([
    'active',
    'archived',
    'draft',
    'deleted',
    'pending',
    'in_progress',
    'approved',
    'rejected',
]) as z.ZodType<RequirementStatus>;
export const EntityTypeSchema = z.enum([
    'document',
    'requirement',
]) as z.ZodType<EntityType>;
export const UserRoleTypeSchema = z.enum([
    'admin',
    'user',
]) as z.ZodType<UserRoleType>;
export const NotificationTypeSchema = z.enum([
    'invitation',
    'mention',
    'system',
]) as z.ZodType<NotificationType>;
export const OrganizationTypeSchema = z.enum([
    'personal',
    'team',
    'enterprise',
]) as z.ZodType<OrganizationType>;
export const PricingPlanIntervalSchema = z.enum([
    'month',
    'year',
]) as z.ZodType<PricingPlanInterval>;
export const ProjectRoleSchema = z.enum([
    'admin',
    'user',
]) as z.ZodType<ProjectRole>;
export const ProjectStatusSchema = z.enum([
    'active',
    'archived',
    'draft',
    'deleted',
    'pending',
    'in_progress',
    'approved',
    'rejected',
]) as z.ZodType<ProjectStatus>;
export const PropertyTypeSchema = z.enum([
    'text',
    'number',
    'date',
    'boolean',
    'list',
    'object',
]) as z.ZodType<PropertyType>;
export const RequirementFormatSchema = z.enum([
    'incose',
    'ears',
    'other',
]) as z.ZodType<RequirementFormat>;
export const RequirementLevelSchema = z.enum([
    'system',
    'component',
    'subsystem',
]) as z.ZodType<RequirementLevel>;
export const RequirementPrioritySchema = z.enum([
    'low',
    'medium',
    'high',
]) as z.ZodType<RequirementPriority>;
