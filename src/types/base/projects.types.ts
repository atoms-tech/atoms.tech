import { ProjectStatus, Visibility } from './enums.types';
import { Json } from './database.types';

export type Project = {
    id: string;
    created_at: string | null;
    created_by: string;
    deleted_at: string | null;
    deleted_by: string | null;
    description: string | null;
    is_deleted: boolean | null;
    metadata: Json | null;
    name: string;
    organization_id: string;
    owned_by: string;
    settings: Json | null;
    slug: string;
    star_count: number | null;
    status: ProjectStatus;
    tags: string[] | null;
    updated_at: string | null;
    updated_by: string;
    version: number | null;
    visibility: Visibility;
};
