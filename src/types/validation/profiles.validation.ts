import { z } from 'zod';

import { Json, Profile, UserStatus } from '@/types';

export const ProfileSchema = z.object({
    id: z.string(),
    avatar_url: z.string().nullable(),
    created_at: z.string().nullable(),
    current_organization_id: z.string().nullable(),
    deleted_at: z.string().nullable(),
    deleted_by: z.string().nullable(),
    email: z.string(),
    full_name: z.string().nullable(),
    is_deleted: z.boolean().nullable(),
    job_title: z.string().nullable(),
    last_login_at: z.string().nullable(),
    login_count: z.number().nullable(),
    personal_organization_id: z.string().nullable(),
    preferences: z.any().nullable() as z.ZodType<Json>,
    status: z.enum(['active', 'inactive']).nullable() as z.ZodType<UserStatus>,
    updated_at: z.string().nullable(),
}) satisfies z.ZodType<Profile>;
