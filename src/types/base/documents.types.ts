import { Tables } from './database.types';

export type Document = Tables<'documents'>;

export type Block = Tables<'blocks'>;

export type ExternalDocument = Tables<'external_documents'>;
