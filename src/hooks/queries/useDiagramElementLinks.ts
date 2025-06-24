import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import type { DiagramElementLink } from '@/types/diagram-element-links.types';
import { diagramElementLinkKeys } from '@/hooks/mutations/useDiagramElementLinkMutations';

// Get all links for a specific diagram
export function useDiagramElementLinks(diagramId: string) {
    return useQuery({
        queryKey: diagramElementLinkKeys.byDiagram(diagramId),
        queryFn: async (): Promise<DiagramElementLink[]> => {
            const { data, error } = await supabase
                .from('diagram_element_links')
                .select(`
                    *,
                    requirements:requirement_id (
                        id,
                        name,
                        description,
                        external_id,
                        priority,
                        status
                    )
                `)
                .eq('diagram_id', diagramId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch diagram element links:', error);
                throw new Error(`Failed to fetch links: ${error.message}`);
            }

            return data as DiagramElementLink[];
        },
        enabled: !!diagramId,
    });
}

// Get links for a specific element in a diagram
export function useElementLinks(diagramId: string, elementId: string) {
    return useQuery({
        queryKey: diagramElementLinkKeys.byElement(diagramId, elementId),
        queryFn: async (): Promise<DiagramElementLink[]> => {
            const { data, error } = await supabase
                .from('diagram_element_links')
                .select(`
                    *,
                    requirements:requirement_id (
                        id,
                        name,
                        description,
                        external_id,
                        priority,
                        status,
                        document_id
                    )
                `)
                .eq('diagram_id', diagramId)
                .eq('element_id', elementId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch element links:', error);
                throw new Error(`Failed to fetch element links: ${error.message}`);
            }

            return data as DiagramElementLink[];
        },
        enabled: !!diagramId && !!elementId,
    });
}

// Get all diagrams that link to a specific requirement
export function useRequirementDiagramLinks(requirementId: string) {
    return useQuery({
        queryKey: diagramElementLinkKeys.byRequirement(requirementId),
        queryFn: async (): Promise<DiagramElementLink[]> => {
            const { data, error } = await supabase
                .from('diagram_element_links')
                .select(`
                    *,
                    excalidraw_diagrams:diagram_id (
                        id,
                        name,
                        project_id,
                        organization_id,
                        thumbnail_url
                    )
                `)
                .eq('requirement_id', requirementId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch requirement diagram links:', error);
                throw new Error(`Failed to fetch requirement links: ${error.message}`);
            }

            return data as DiagramElementLink[];
        },
        enabled: !!requirementId,
    });
}

// Get detailed view of links with all related data
export function useDiagramElementLinksWithDetails(diagramId: string) {
    return useQuery({
        queryKey: [...diagramElementLinkKeys.byDiagram(diagramId), 'with-details'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('diagram_element_links_with_details')
                .select('*')
                .eq('diagram_id', diagramId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch detailed diagram element links:', error);
                throw new Error(`Failed to fetch detailed links: ${error.message}`);
            }

            return data;
        },
        enabled: !!diagramId,
    });
}

// Get link statistics for a diagram
export function useDiagramLinkStats(diagramId: string) {
    return useQuery({
        queryKey: [...diagramElementLinkKeys.byDiagram(diagramId), 'stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('diagram_element_links')
                .select('id, link_type, element_id')
                .eq('diagram_id', diagramId);

            if (error) {
                console.error('Failed to fetch diagram link stats:', error);
                throw new Error(`Failed to fetch link stats: ${error.message}`);
            }

            const stats = {
                totalLinks: data.length,
                manualLinks: data.filter(link => link.link_type === 'manual').length,
                autoDetectedLinks: data.filter(link => link.link_type === 'auto_detected').length,
                linkedElements: new Set(data.map(link => link.element_id)).size,
                linksByType: data.reduce((acc, link) => {
                    acc[link.link_type] = (acc[link.link_type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
            };

            return stats;
        },
        enabled: !!diagramId,
    });
}

// Check if a specific element has links
export function useElementHasLinks(diagramId: string, elementId: string) {
    return useQuery({
        queryKey: [...diagramElementLinkKeys.byElement(diagramId, elementId), 'has-links'],
        queryFn: async (): Promise<boolean> => {
            const { data, error } = await supabase
                .from('diagram_element_links')
                .select('id')
                .eq('diagram_id', diagramId)
                .eq('element_id', elementId)
                .limit(1);

            if (error) {
                console.error('Failed to check element links:', error);
                return false;
            }

            return data.length > 0;
        },
        enabled: !!diagramId && !!elementId,
    });
}

// Get links for multiple elements at once (for performance)
export function useMultipleElementLinks(diagramId: string, elementIds: string[]) {
    return useQuery({
        queryKey: [...diagramElementLinkKeys.byDiagram(diagramId), 'multiple-elements', elementIds.sort()],
        queryFn: async (): Promise<Record<string, DiagramElementLink[]>> => {
            if (elementIds.length === 0) return {};

            const { data, error } = await supabase
                .from('diagram_element_links')
                .select(`
                    *,
                    requirements:requirement_id (
                        id,
                        name,
                        description,
                        external_id,
                        priority,
                        status
                    )
                `)
                .eq('diagram_id', diagramId)
                .in('element_id', elementIds);

            if (error) {
                console.error('Failed to fetch multiple element links:', error);
                throw new Error(`Failed to fetch multiple element links: ${error.message}`);
            }

            // Group links by element ID
            const linksByElement = data.reduce((acc, link) => {
                if (!acc[link.element_id]) {
                    acc[link.element_id] = [];
                }
                acc[link.element_id].push(link as DiagramElementLink);
                return acc;
            }, {} as Record<string, DiagramElementLink[]>);

            return linksByElement;
        },
        enabled: !!diagramId && elementIds.length > 0,
    });
}

// Search for links across diagrams in a project
export function useSearchDiagramLinks(projectId: string, searchQuery: string) {
    return useQuery({
        queryKey: ['diagram-element-links', 'search', projectId, searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];

            const { data, error } = await supabase
                .from('diagram_element_links_with_details')
                .select('*')
                .eq('project_id', projectId)
                .or(`requirement_name.ilike.%${searchQuery}%,requirement_description.ilike.%${searchQuery}%,diagram_name.ilike.%${searchQuery}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Failed to search diagram links:', error);
                throw new Error(`Failed to search links: ${error.message}`);
            }

            return data;
        },
        enabled: !!projectId && !!searchQuery.trim(),
    });
}
