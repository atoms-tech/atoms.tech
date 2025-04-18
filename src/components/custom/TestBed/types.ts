import { Tables } from '@/types/base/database.types';

export type TestReq = Tables<'test_req'>;
export type RequirementTest = Tables<'requirement_tests'>;

// Basic types
export type TestType =
    | 'unit'
    | 'integration'
    | 'system'
    | 'acceptance'
    | 'performance'
    | 'security'
    | 'usability'
    | 'other';
export type TestPriority = 'critical' | 'high' | 'medium' | 'low';
export type TestStatus =
    | 'draft'
    | 'ready'
    | 'in_progress'
    | 'blocked'
    | 'completed'
    | 'obsolete';
export type TestMethod = 'manual' | 'automated' | 'hybrid';
export type ExecutionStatus =
    | 'not_executed'
    | 'in_progress'
    | 'passed'
    | 'failed'
    | 'blocked'
    | 'skipped';

// Interface for test steps
export interface TestStep {
    step_number: number;
    description: string;
    expected_result?: string;
}

// Filter and pagination
export interface TestReqFilter {
    status?: TestStatus[];
    priority?: TestPriority[];
    test_type?: TestType[];
    method?: TestMethod[];
    category?: string[];
    search?: string;
    created_by?: string;
    is_active?: boolean;
}

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}

// Response types
export interface TestReqResponse {
    data: TestReq[];
    count: number;
    error: Error | null;
}

export interface RequirementTestResponse {
    data: RequirementTest[];
    count: number;
    error: Error | null;
}
