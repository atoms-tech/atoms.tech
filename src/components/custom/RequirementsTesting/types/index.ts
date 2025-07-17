import { Database, Tables } from '@/types/base/database.types';

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type ExecutionStatus = Database['public']['Enums']['execution_status'];
export type RequirementTest = Tables<'requirement_tests'>;

export interface TestMatrixViewConfiguration {
    selectedRequirementIds: string[];
    selectedTestCaseIds: string[];
    filters: {
        search?: string;
    };
    uiState?: {
        compactView: boolean;
        highlightPassing: boolean;
        showEmpty: boolean;
        isRequirementSectionExpanded: boolean;
        isTestCasesSectionExpanded: boolean;
    };
}

export interface TestMatrixViewState {
    id: string;
    name: string;
    projectId: string;
    configuration: TestMatrixViewConfiguration;
    isDefault?: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface Requirement {
    id: string;
    name: string;
    external_id?: string | null;
    level: string;
}

export interface TestCase {
    id: string;
    title: string;
    test_id?: string | null;
    test_type: string;
    priority?: string;
}

export type TestMatrixMode = 'view-list' | 'new-view' | 'edit-view';

// API Response Types
export interface APIRequirement {
    id: string;
    name: string;
    external_id: string | null;
    level: string;
    ai_analysis: Json;
    block_id: string;
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    description: string | null;
    version: number;
}

export interface APITestCase {
    id: string;
    name: string;
    test_id: string | null;
    type:
        | 'system'
        | 'other'
        | 'unit'
        | 'integration'
        | 'acceptance'
        | 'performance'
        | 'security'
        | 'usability';
    priority?: string;
    result: string;
    attachments: Json;
    category: string[] | null;
    version: string | null;
}

export interface APIRequirementTest {
    requirementId: string;
    testCaseId: string;
    execution_status: string;
    created_at: string | null;
    defects: Json;
    evidence_artifacts: Json;
    executed_at: string | null;
    executed_by: string | null;
    updated_at: string | null;
}

// Type Guards and Mappers
export function mapAPIRequirement(req: APIRequirement): Requirement {
    return {
        id: req.id,
        name: req.name,
        external_id: req.external_id,
        level: req.level,
    };
}

export function mapAPITestCase(test: APITestCase): TestCase {
    return {
        id: test.id,
        title: test.name,
        test_id: test.test_id,
        test_type: test.type,
        priority: test.priority,
    };
}

export function mapAPIRequirementTest(rt: APIRequirementTest): RequirementTest {
    const validStatuses: ExecutionStatus[] = [
        'not_executed',
        'in_progress',
        'passed',
        'failed',
        'blocked',
        'skipped',
    ];
    const status = validStatuses.includes(rt.execution_status as ExecutionStatus)
        ? (rt.execution_status as ExecutionStatus)
        : 'not_executed';

    return {
        requirement_id: rt.requirementId,
        test_id: rt.testCaseId,
        execution_status: status,
        created_at: rt.created_at,
        defects: rt.defects || null,
        evidence_artifacts: rt.evidence_artifacts || null,
        executed_at: rt.executed_at,
        executed_by: rt.executed_by,
        execution_environment: null,
        execution_version: null,
        external_req_id: null,
        external_test_id: null,
        id: `${rt.requirementId}_${rt.testCaseId}`,
        result_notes: null,
        updated_at: rt.updated_at,
    };
}

export type TestReq = Tables<'test_req'>;
export type TestMatrixViews = Tables<'test_matrix_views'>;

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
