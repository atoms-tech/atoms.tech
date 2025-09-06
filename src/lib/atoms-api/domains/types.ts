import type { Tables } from '@/types/base/database.types';

export type Profile = Tables<'profiles'>;
export type Organization = Tables<'organizations'>;
export type Project = Tables<'projects'>;
export type ProjectMember = Tables<'project_members'> & {
  profiles?: Tables<'profiles'> | null;
};

