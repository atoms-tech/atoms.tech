import { UserStatus } from './enums.types';
import { Json } from './database.types';

export type Profile = {
    id: string;
    avatar_url: string | null;
    created_at: string | null;
    current_organization_id: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    email: string;
    full_name: string | null;
    is_deleted: boolean | null;
    job_title: string | null;
    last_login_at: string | null;
    login_count: number | null;
    personal_organization_id: string | null;
    preferences: Json | null;
    status: UserStatus | null;
    updated_at: string | null;
};
