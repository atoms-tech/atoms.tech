import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import type {
    DiagramElementLink,
    CreateDiagramElementLinkInput,
    UpdateDiagramElementLinkInput,
    BulkLinkOperation,
    BulkLinkResult,
} from '@/types/diagram-element-links.types';

// Query key factory for diagram element links
export const diagramElementLinkKeys = {
    all: ['diagram-element-links'] as const,
    byDiagram: (diagramId: string) => [...diagramElementLinkKeys.all, 'diagram', diagramId] as const,
    byElement: (diagramId: string, elementId: string) => [...diagramElementLinkKeys.byDiagram(diagramId), 'element', elementId] as const,
    byRequirement: (requirementId: string) => [...diagramElementLinkKeys.all, 'requirement', requirementId] as const,
};

// Helper function to invalidate related queries
const invalidateQueries = (queryClient: ReturnType<typeof useQueryClient>, link: DiagramElementLink) => {
    queryClient.invalidateQueries({ queryKey: diagramElementLinkKeys.byDiagram(link.diagram_id) });
    queryClient.invalidateQueries({ queryKey: diagramElementLinkKeys.byElement(link.diagram_id, link.element_id) });
    queryClient.invalidateQueries({ queryKey: diagramElementLinkKeys.byRequirement(link.requirement_id) });
};

// Create a new diagram element link
export function useCreateDiagramElementLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateDiagramElementLinkInput): Promise<DiagramElementLink> => {
            const { data, error } = await supabase
                .from('diagram_element_links')
                .insert({
                    ...input,
                    created_by: (await supabase.auth.getUser()).data.user?.id,
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to create diagram element link:', error);
                throw new Error(`Failed to create link: ${error.message}`);
            }

            return data as DiagramElementLink;
        },
        onSuccess: (data) => {
            invalidateQueries(queryClient, data);
        },
        onError: (error) => {
            console.error('Error creating diagram element link:', error);
        },
    });
}

// Update an existing diagram element link
export function useUpdateDiagramElementLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateDiagramElementLinkInput): Promise<DiagramElementLink> => {
            const { id, ...updateData } = input;
            
            const { data, error } = await supabase
                .from('diagram_element_links')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Failed to update diagram element link:', error);
                throw new Error(`Failed to update link: ${error.message}`);
            }

            return data as DiagramElementLink;
        },
        onSuccess: (data) => {
            invalidateQueries(queryClient, data);
        },
        onError: (error) => {
            console.error('Error updating diagram element link:', error);
        },
    });
}

// Delete a diagram element link
export function useDeleteDiagramElementLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (linkId: string): Promise<DiagramElementLink> => {
            // First get the link data for cache invalidation
            const { data: linkData, error: fetchError } = await supabase
                .from('diagram_element_links')
                .select()
                .eq('id', linkId)
                .single();

            if (fetchError) {
                throw new Error(`Failed to fetch link for deletion: ${fetchError.message}`);
            }

            const { data, error } = await supabase
                .from('diagram_element_links')
                .delete()
                .eq('id', linkId)
                .select()
                .single();

            if (error) {
                console.error('Failed to delete diagram element link:', error);
                throw new Error(`Failed to delete link: ${error.message}`);
            }

            return linkData as DiagramElementLink;
        },
        onSuccess: (data) => {
            invalidateQueries(queryClient, data);
        },
        onError: (error) => {
            console.error('Error deleting diagram element link:', error);
        },
    });
}

// Bulk create multiple diagram element links
export function useBulkCreateDiagramElementLinks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (inputs: CreateDiagramElementLinkInput[]): Promise<BulkLinkResult> => {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            
            const insertData = inputs.map(input => ({
                ...input,
                created_by: userId,
            }));

            const { data, error } = await supabase
                .from('diagram_element_links')
                .insert(insertData)
                .select();

            if (error) {
                console.error('Failed to bulk create diagram element links:', error);
                return {
                    success: false,
                    processed: 0,
                    errors: [{ index: 0, error: error.message }],
                };
            }

            return {
                success: true,
                processed: data.length,
                errors: [],
            };
        },
        onSuccess: (result, inputs) => {
            if (result.success && inputs.length > 0) {
                // Invalidate queries for all affected diagrams
                const diagramIds = [...new Set(inputs.map(input => input.diagram_id))];
                diagramIds.forEach(diagramId => {
                    queryClient.invalidateQueries({ queryKey: diagramElementLinkKeys.byDiagram(diagramId) });
                });
            }
        },
        onError: (error) => {
            console.error('Error bulk creating diagram element links:', error);
        },
    });
}

// Delete multiple diagram element links
export function useBulkDeleteDiagramElementLinks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (linkIds: string[]): Promise<BulkLinkResult> => {
            // First get the link data for cache invalidation
            const { data: linksData, error: fetchError } = await supabase
                .from('diagram_element_links')
                .select()
                .in('id', linkIds);

            if (fetchError) {
                return {
                    success: false,
                    processed: 0,
                    errors: [{ index: 0, error: fetchError.message }],
                };
            }

            const { error } = await supabase
                .from('diagram_element_links')
                .delete()
                .in('id', linkIds);

            if (error) {
                console.error('Failed to bulk delete diagram element links:', error);
                return {
                    success: false,
                    processed: 0,
                    errors: [{ index: 0, error: error.message }],
                };
            }

            // Invalidate queries for all affected diagrams
            if (linksData) {
                const diagramIds = [...new Set(linksData.map(link => link.diagram_id))];
                diagramIds.forEach(diagramId => {
                    queryClient.invalidateQueries({ queryKey: diagramElementLinkKeys.byDiagram(diagramId) });
                });
            }

            return {
                success: true,
                processed: linkIds.length,
                errors: [],
            };
        },
        onError: (error) => {
            console.error('Error bulk deleting diagram element links:', error);
        },
    });
}
