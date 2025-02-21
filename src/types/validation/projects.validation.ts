import { z } from 'zod';

import {
    Block,
    BlockPropertySchema,
    DocumentPropertySchema,
    Json,
    Project,
    ProjectStatus,
    Visibility,
} from '@/types';

export const ProjectSchema = z.object({
    id: z.string(),
    created_at: z.string().nullable(),
    created_by: z.string(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    description: z.string().nullable(),
    is_deleted: z.boolean().nullable(),
    metadata: z.any().nullable() as z.ZodType<Json>,
    name: z.string(),
    organization_id: z.string(),
    owned_by: z.string(),
    settings: z.any().nullable() as z.ZodType<Json>,
    slug: z.string(),
    star_count: z.number().nullable(),
    status: z.enum([
        'active',
        'archived',
        'draft',
        'deleted',
    ]) as z.ZodType<ProjectStatus>,
    tags: z.array(z.string()).nullable(),
    updated_at: z.string().nullable(),
    updated_by: z.string(),
    version: z.number().nullable(),
    visibility: z.enum([
        'private',
        'team',
        'organization',
        'public',
    ]) as z.ZodType<Visibility>,
}) satisfies z.ZodType<Project>;

export const DocumentPropertyZodSchema = z.object({
    id: z.string(),
    created_at: z.string().nullable(),
    created_by: z.string(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    document_id: z.string(),
    is_deleted: z.boolean().nullable(),
    updated_at: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number(),
}) satisfies z.ZodType<DocumentPropertySchema>;

export const BlockSchema = z.object({
    id: z.string(),
    content: z.any().nullable() as z.ZodType<Json>,
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    document_id: z.string(),
    is_deleted: z.boolean().nullable(),
    position: z.number(),
    type: z.string(),
    updated_at: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number(),
}) satisfies z.ZodType<Block>;

export const BlockPropertyZodSchema = z.object({
    id: z.string(),
    block_id: z.string(),
    property_id: z.string(),
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    is_deleted: z.boolean().nullable(),
    updated_at: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number(),
}) satisfies z.ZodType<BlockPropertySchema>;
