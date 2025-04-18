import { Tables } from './database.types';

export type Requirement = Tables<'requirements'>;

export type RequirementAiAnalysis = {
    descriptionHistory: {
        description: string;
        createdAt: string;
        createdBy: string;
    }[];
} | null;
