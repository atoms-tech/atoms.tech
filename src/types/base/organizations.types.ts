import { Database } from './database.types';

export type Organization = Database['public']['Tables']['organizations']['Row'];

export type OrganizationMembers =
    Database['public']['Tables']['organization_members']['Row'];
