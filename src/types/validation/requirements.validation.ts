import { z } from 'zod';

import {
    Json,
    Requirement,
    RequirementFormat,
    RequirementLevel,
    RequirementPriority,
    RequirementStatus,
} from '@/types';

export const RequirementSchema = z.object({
    id: z.string(),
    ai_analysis: z.any().nullable() as z.ZodType<Json>,
    block_id: z.string(),
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    description: z.string().nullable(),
    document_id: z.string(),
    enchanced_requirement: z.string().nullable(),
    external_id: z.string().nullable(),
    format: z.enum(['incose', 'ears', 'other']) as z.ZodType<RequirementFormat>,
    is_deleted: z.boolean().nullable(),
    level: z.enum([
        'component',
        'system',
        'subsystem',
    ]) as z.ZodType<RequirementLevel>,
    name: z.string(),
    original_requirement: z.string().nullable(),
    priority: z.enum([
        'low',
        'medium',
        'high',
    ]) as z.ZodType<RequirementPriority>,
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
    tags: z.array(z.string()).nullable(),
    updated_at: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number(),
}) satisfies z.ZodType<Requirement>;
