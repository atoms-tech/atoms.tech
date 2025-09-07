import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

interface RequirementTreeNode {
    requirement_id: string;
    title: string;
    parent_id: string | null;
    depth: number;
    path: string;
    has_children: boolean;
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
    const response = await fetch('/api/requirements/relationships', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete relationship');
    }

    return response.json();
}

async function getRequirementDescendants(
    requirementId: string,
    maxDepth?: number,
): Promise<RequirementNode[]> {
    const params = new URLSearchParams({
        requirementId,
        type: 'descendants',
    });

    if (maxDepth) {
        params.append('maxDepth', maxDepth.toString());
    }

    const response = await fetch(`/api/requirements/relationships?${params}`);

    if (!response.ok) {
        throw new Error('Failed to fetch descendants');
    }

    const result = await response.json();
    return result.data;
}

async function getRequirementAncestors(
    requirementId: string,
    maxDepth?: number,
): Promise<RequirementNode[]> {
    const params = new URLSearchParams({
        requirementId,
        type: 'ancestors',
    });

    if (maxDepth) {
        params.append('maxDepth', maxDepth.toString());
    }

    const response = await fetch(`/api/requirements/relationships?${params}`);

    if (!response.ok) {
        throw new Error('Failed to fetch ancestors');
    }

    const result = await response.json();
    return result.data;
}

async function getRequirementTree(projectId?: string): Promise<RequirementTreeNode[]> {
    const params = new URLSearchParams({
        type: 'tree',
    });

    if (projectId) {
        params.append('projectId', projectId);
    }

    const response = await fetch(`/api/requirements/relationships?${params}`);

    if (!response.ok) {
        throw new Error('Failed to fetch requirement tree');
    }

    const result = await response.json();
    return result.data;
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
            // Remove broad invalidation to prevent unnecessary refetches
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
            // Remove broad invalidation to prevent unnecessary refetches
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
        staleTime: 3 * 60 * 1000, // Consider data fresh for 3 minutes
        gcTime: 8 * 60 * 1000, // Keep in cache for 8 minutes
    });
}

export function useRequirementAncestors(requirementId: string, maxDepth?: number) {
    return useQuery({
        queryKey: queryKeys.requirements.ancestors(requirementId, maxDepth),
        queryFn: () => getRequirementAncestors(requirementId, maxDepth),
        enabled: !!requirementId,
        staleTime: 3 * 60 * 1000, // Consider data fresh for 3 minutes
        gcTime: 8 * 60 * 1000, // Keep in cache for 8 minutes
    });
}

export function useRequirementTree(projectId?: string) {
    return useQuery({
        queryKey: queryKeys.requirements.tree(projectId),
        queryFn: () => getRequirementTree(projectId),
        enabled: !!projectId, // Only run when projectId is provided
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });
}
