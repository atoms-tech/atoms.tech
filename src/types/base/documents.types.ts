import { Database } from './database.types';

export type Document = Database['public']['Tables']['documents']['Row'];

export type Block = Database['public']['Tables']['blocks']['Row'];

export type ExternalDocument =
    Database['public']['Tables']['external_documents']['Row'];
