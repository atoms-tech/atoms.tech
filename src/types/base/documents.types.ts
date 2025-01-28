import { Json } from './database.types';

export type Document = {
    id: string;
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    description: string | null;
    is_deleted: boolean | null;
    name: string;
    project_id: string;
    slug: string;
    tags: string[] | null;
    updated_at: string | null;
    updated_by: string | null;
    version: number;
};

export type DocumentPropertySchema = {
    id: string;
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    document_id: string;
    is_deleted: boolean | null;
    updated_at: string | null;
    updated_by: string | null;
    version: number;
};

export type Block = {
    id: string;
    content: Json | null;
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    document_id: string;
    is_deleted: boolean | null;
    position: number;
    type: string;
    updated_at: string | null;
    updated_by: string | null;
    version: number;
};

export type BlockPropertySchema = {
    id: string;
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    block_id: string;
    is_deleted: boolean | null;
    updated_at: string | null;
    updated_by: string | null;
    version: number;
};
