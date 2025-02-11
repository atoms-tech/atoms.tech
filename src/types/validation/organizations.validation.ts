import {
    BillingPlan,
    Json,
    Organization,
    OrganizationType,
    PricingPlanInterval,
} from '@/types';
import { z } from 'zod';

export const OrganizationSchema = z.object({
    id: z.string(),
    billing_cycle: z.enum([
        'none',
        'month',
        'year',
    ]) as z.ZodType<PricingPlanInterval>,
    billing_plan: z.enum([
        'free',
        'pro',
        'enterprise',
    ]) as z.ZodType<BillingPlan>,
    created_at: z.string().nullable(),
    created_by: z.string(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    description: z.string().nullable(),
    is_deleted: z.boolean().nullable(),
    logo_url: z.string().nullable(),
    max_members: z.number(),
    max_monthly_requests: z.number(),
    member_count: z.number().nullable(),
    metadata: z.any().nullable() as z.ZodType<Json>,
    name: z.string(),
    settings: z.any().nullable() as z.ZodType<Json>,
    slug: z.string(),
    status: z.enum(['active', 'inactive']).nullable(),
    storage_used: z.number().nullable(),
    type: z.enum(['personal', 'team']) as z.ZodType<OrganizationType>,
    updated_at: z.string().nullable(),
    updated_by: z.string(),
}) satisfies z.ZodType<Organization>;
