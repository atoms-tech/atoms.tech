import { z } from 'zod';
import { Document } from '@/types';

export const DocumentSchema = z.object({
    id: z.string(),
    created_at: z.string().nullable(),
    created_by: z.string().nullable(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    description: z.string().nullable(),
    is_deleted: z.boolean().nullable(),
    name: z.string(),
    project_id: z.string(),
    slug: z.string(),
    tags: z.array(z.string()).nullable(),
    updated_at: z.string().nullable(),
    updated_by: z.string().nullable(),
    version: z.number(),
}) satisfies z.ZodType<Document>;
