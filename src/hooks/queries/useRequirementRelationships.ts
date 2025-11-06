import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { queryKeys } from '@/lib/constants/queryKeys';

// Types
interface CreateRelationshipRequest {
    ancestorId: string;
    descendantId: string;
}

interface RelationshipResult {
    success: boolean;
    message: string;
    relationshipsCreated?: number;
    relationshipsDeleted?: number;
    error?: string;
}

interface RequirementNode {
    requirementId: string;
    title: string;
    depth: number;
    directParent: boolean;
}

export interface RequirementTreeNode {
    requirement_id: string;
    title: string;
    parent_id: string | null;
    depth: number;
    path: string;
    has_children: boolean;
}

export interface RequirementRelationshipCheck {
    hasRelationships: boolean;
    relationshipCount: number;
    relatedRequirements: Array<{
        id: string;
        name: string;
        external_id: string;
    }>;
}

// API functions
async function createRelationship(
    request: CreateRelationshipRequest,
): Promise<RelationshipResult> {
    const response = await fetch('/api/requirements/relationships', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create relationship');
    }

    return response.json();
}

async function deleteRelationship(
    request: CreateRelationshipRequest,
): Promise<RelationshipResult> {
    // Debug: log outgoing request body
    try {
        console.log('[Relationships] DELETE request', request);
    } catch {}

    const response = await fetch('/api/requirements/relationships', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        let errorMessage = 'Failed to delete relationship';
        try {
            const error = await response.json();
            errorMessage = error.message || error.error || errorMessage;
        } catch {
            // If response is not JSON, try to get text
            try {
                const text = await response.text();
                errorMessage = text || errorMessage;
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
        }
        throw new Error(errorMessage);
    }

    let json: RelationshipResult & {
        relationshipsDeleted?: number | null;
        message?: string;
    };
    try {
        json = (await response.json()) as RelationshipResult & {
            relationshipsDeleted?: number | null;
            message?: string;
        };
    } catch (error) {
        // If response is not JSON, return a success response
        console.warn('[Relationships] DELETE response is not JSON, assuming success');
        return {
            success: true,
            message: 'Relationship deleted',
            relationshipsDeleted: 1,
        };
    }

    // Debug: log response payload
    try {
        console.log('[Relationships] DELETE response', json);
    } catch {}

    return json;
}

async function getRequirementDescendants(
    requirementId: string,
    maxDepth?: number,
): Promise<RequirementNode[]> {
    const params = new URLSearchParams({ requirementId, type: 'descendants' });
    if (maxDepth) params.append('maxDepth', maxDepth.toString());
    const response = await fetch(`/api/requirements/relationships?${params}`);
    if (!response.ok) throw new Error('Failed to fetch descendants');
    const result = await response.json();
    return result.data;
}

async function getRequirementAncestors(
    requirementId: string,
    maxDepth?: number,
): Promise<RequirementNode[]> {
    const params = new URLSearchParams({ requirementId, type: 'ancestors' });
    if (maxDepth) params.append('maxDepth', maxDepth.toString());
    const response = await fetch(`/api/requirements/relationships?${params}`);
    if (!response.ok) throw new Error('Failed to fetch ancestors');
    const result = await response.json();
    return result.data;
}

async function getRequirementTree(projectId?: string): Promise<RequirementTreeNode[]> {
    const params = new URLSearchParams({ type: 'tree' });
    if (projectId) params.append('projectId', projectId);
    const response = await fetch(`/api/requirements/relationships?${params}`);
    if (!response.ok) throw new Error('Failed to fetch requirement tree');
    const result = await response.json();
    return result.data;
}

async function checkRequirementRelationships(
    requirementId: string,
): Promise<RequirementRelationshipCheck> {
    const params = new URLSearchParams({ requirementId, type: 'check' });
    const response = await fetch(`/api/requirements/relationships?${params}`);
    if (!response.ok) throw new Error('Failed to check requirement relationships');
    return response.json();
}

// Hooks
export function useCreateRelationship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRelationship,
        onSuccess: (data, variables) => {
            // Targeted invalidation - only invalidate queries that actually changed
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.descendants(variables.ancestorId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.ancestors(variables.descendantId),
            });
            // Only invalidate tree queries - more targeted than all requirements
            queryClient.invalidateQueries({
                queryKey: ['requirements', 'tree'],
            });
            // Also invalidate requirements-by-ids queries to ensure full requirement data is refetched
            queryClient.invalidateQueries({
                queryKey: ['requirements', 'byIds'],
            });
            // Invalidate individual requirement queries to ensure external_id is available
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.detail(variables.ancestorId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.detail(variables.descendantId),
            });
        },
        onError: (error) => {
            console.error('Failed to create relationship:', error);
        },
    });
}

export function useDeleteRelationship() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRelationship,
        onSuccess: (data, variables) => {
            // Invalidate descendants for the ancestor (parent) - this removes the child from parent's children list
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.descendants(variables.ancestorId),
            });
            // Invalidate ancestors for the descendant (child) - this removes the parent from child's ancestors list
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.ancestors(variables.descendantId),
            });
            // Invalidate tree queries to update the full hierarchy view
            queryClient.invalidateQueries({
                queryKey: ['requirements', 'tree'],
            });
            // Invalidate requirements-by-ids queries to ensure full requirement data is refetched
            queryClient.invalidateQueries({
                queryKey: ['requirements', 'byIds'],
            });
            // Invalidate individual requirement queries to ensure external_id is available
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.detail(variables.ancestorId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirements.detail(variables.descendantId),
            });
            // Force refetch to ensure UI updates immediately
            queryClient.refetchQueries({
                queryKey: queryKeys.requirements.descendants(variables.ancestorId),
            });
            queryClient.refetchQueries({
                queryKey: queryKeys.requirements.ancestors(variables.descendantId),
            });
            // Force refetch tree queries to ensure hierarchy view updates immediately
            queryClient.refetchQueries({
                queryKey: ['requirements', 'tree'],
            });
        },
        onError: (error) => {
            console.error('Failed to delete relationship:', error);
        },
    });
}

export function useRequirementDescendants(requirementId: string, maxDepth?: number) {
    return useQuery({
        queryKey: queryKeys.requirements.descendants(requirementId, maxDepth),
        queryFn: () => getRequirementDescendants(requirementId, maxDepth),
        enabled: !!requirementId,
        staleTime: 3 * 60 * 1000,
        gcTime: 8 * 60 * 1000,
    });
}

export function useRequirementAncestors(requirementId: string, maxDepth?: number) {
    return useQuery({
        queryKey: queryKeys.requirements.ancestors(requirementId, maxDepth),
        queryFn: () => getRequirementAncestors(requirementId, maxDepth),
        enabled: !!requirementId,
        staleTime: 3 * 60 * 1000,
        gcTime: 8 * 60 * 1000,
    });
}

export function useRequirementTree(projectId?: string) {
    return useQuery({
        queryKey: queryKeys.requirements.tree(projectId),
        queryFn: () => getRequirementTree(projectId),
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function useCheckRequirementRelationships(requirementId: string) {
    return useQuery({
        queryKey: ['requirements', 'check', requirementId],
        queryFn: () => checkRequirementRelationships(requirementId),
        enabled: !!requirementId,
        staleTime: 0, // Always fetch fresh data for relationship checks
        gcTime: 1 * 60 * 1000, // Keep in cache for 1 minute
    });
}
