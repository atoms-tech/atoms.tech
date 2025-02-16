import { z } from 'zod';
import { Block, Json } from '@/types';

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