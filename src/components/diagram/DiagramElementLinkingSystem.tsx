'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import type { 
    ElementContextMenuAction, 
    DiagramElementLink,
    LabelParserResult 
} from '@/types/diagram-element-links.types';

import DiagramElementContextMenu, { useElementContextMenu } from './DiagramElementContextMenu';
import RequirementLinkDialog from './RequirementLinkDialog';
import ElementLinkIndicators, { LinkStats, AutoDetectionBadge } from './ElementLinkIndicators';

import { useDiagramElementLinks } from '@/hooks/queries/useDiagramElementLinks';
import { 
    useCreateDiagramElementLink, 
    useUpdateDiagramElementLink, 
    useDeleteDiagramElementLink,
    useBulkCreateDiagramElementLinks 
} from '@/hooks/mutations/useDiagramElementLinkMutations';
import { batchParseElements, getAutoLinkSuggestions, DEFAULT_AUTO_DETECTION_CONFIG } from '@/utils/labelParser';
import { useRequirements } from '@/hooks/queries/useRequirement';

interface DiagramElementLinkingSystemProps {
    diagramId: string;
    projectId: string;
    elements: readonly ExcalidrawElement[];
    appState: AppState;
    onElementNavigate?: (requirementId: string) => void;
    className?: string;
}

export function DiagramElementLinkingSystem({
    diagramId,
    projectId,
    elements,
    appState,
    onElementNavigate,
    className = '',
}: DiagramElementLinkingSystemProps) {
    const router = useRouter();
    const pathname = usePathname();
    
    // State management
    const [requirementDialogState, setRequirementDialogState] = useState({
        isOpen: false,
        elementId: null as string | null,
        existingLink: null as DiagramElementLink | null,
        searchQuery: '',
        selectedRequirementId: null as string | null,
    });
    
    const [autoDetectionResults, setAutoDetectionResults] = useState<LabelParserResult[]>([]);
    const [showAutoSuggestions, setShowAutoSuggestions] = useState(false);

    // Hooks
    const contextMenu = useElementContextMenu();
    const { data: links = [], isLoading: isLoadingLinks } = useDiagramElementLinks(diagramId);
    const { data: requirements = [] } = useRequirements({ projectId });
    
    // Mutations
    const createLinkMutation = useCreateDiagramElementLink();
    const updateLinkMutation = useUpdateDiagramElementLink();
    const deleteLinkMutation = useDeleteDiagramElementLink();
    const bulkCreateMutation = useBulkCreateDiagramElementLinks();

    // Auto-detection effect
    useEffect(() => {
        if (elements.length === 0 || requirements.length === 0) return;

        const elementsWithText = elements
            .filter(el => 'text' in el && el.text && el.text.trim().length > 0)
            .map(el => ({
                id: el.id,
                text: (el as any).text,
                type: el.type,
            }));

        if (elementsWithText.length === 0) return;

        const results = batchParseElements(elementsWithText, requirements, DEFAULT_AUTO_DETECTION_CONFIG);
        setAutoDetectionResults(results);
    }, [elements, requirements]);

    // Handle right-click on elements
    const handleElementRightClick = useCallback((
        event: React.MouseEvent,
        elementId: string,
        elementType?: string,
        elementText?: string
    ) => {
        event.preventDefault();
        event.stopPropagation();

        // Find existing link for this element
        const existingLink = links.find(link => link.element_id === elementId);

        contextMenu.openMenu(
            { x: event.clientX, y: event.clientY },
            elementId,
            elementType,
            elementText,
            existingLink
        );
    }, [links, contextMenu]);

    // Handle context menu actions
    const handleContextMenuAction = useCallback((
        action: ElementContextMenuAction,
        elementId: string,
        existingLink?: DiagramElementLink
    ) => {
        switch (action) {
            case 'add_link':
                setRequirementDialogState({
                    isOpen: true,
                    elementId,
                    existingLink: null,
                    searchQuery: '',
                    selectedRequirementId: null,
                });
                break;

            case 'edit_link':
                if (existingLink) {
                    setRequirementDialogState({
                        isOpen: true,
                        elementId,
                        existingLink,
                        searchQuery: '',
                        selectedRequirementId: existingLink.requirement_id,
                    });
                }
                break;

            case 'remove_link':
                if (existingLink) {
                    deleteLinkMutation.mutate(existingLink.id, {
                        onSuccess: () => {
                            toast.success('Link removed successfully');
                        },
                        onError: (error) => {
                            toast.error(`Failed to remove link: ${error.message}`);
                        },
                    });
                }
                break;

            case 'navigate_to_requirement':
                if (existingLink) {
                    handleNavigateToRequirement(existingLink.requirement_id);
                }
                break;

            case 'copy_link':
                if (existingLink) {
                    const linkUrl = `${window.location.origin}${pathname}?requirement=${existingLink.requirement_id}`;
                    navigator.clipboard.writeText(linkUrl);
                    toast.success('Link copied to clipboard');
                }
                break;

            case 'view_all_links':
                // Could open a side panel or navigate to a links view
                toast.info('View all links feature coming soon');
                break;
        }
    }, [deleteLinkMutation, pathname]);

    // Handle requirement selection
    const handleRequirementSelection = useCallback((
        requirementId: string,
        elementId: string,
        existingLink?: DiagramElementLink
    ) => {
        if (existingLink) {
            // Update existing link
            updateLinkMutation.mutate({
                id: existingLink.id,
                requirement_id: requirementId,
            }, {
                onSuccess: () => {
                    toast.success('Link updated successfully');
                    setRequirementDialogState(prev => ({ ...prev, isOpen: false }));
                },
                onError: (error) => {
                    toast.error(`Failed to update link: ${error.message}`);
                },
            });
        } else {
            // Create new link
            createLinkMutation.mutate({
                diagram_id: diagramId,
                element_id: elementId,
                requirement_id: requirementId,
                link_type: 'manual',
            }, {
                onSuccess: () => {
                    toast.success('Link created successfully');
                    setRequirementDialogState(prev => ({ ...prev, isOpen: false }));
                },
                onError: (error) => {
                    toast.error(`Failed to create link: ${error.message}`);
                },
            });
        }
    }, [createLinkMutation, updateLinkMutation, diagramId]);

    // Handle navigation to requirement
    const handleNavigateToRequirement = useCallback((requirementId: string) => {
        if (onElementNavigate) {
            onElementNavigate(requirementId);
        } else {
            // Default navigation - could be enhanced based on app routing
            const orgId = pathname.split('/')[2];
            router.push(`/org/${orgId}/project/${projectId}/requirements/${requirementId}`);
        }
    }, [onElementNavigate, router, pathname, projectId]);

    // Handle auto-suggestion acceptance
    const handleAcceptAutoSuggestions = useCallback(() => {
        const suggestions = getAutoLinkSuggestions(autoDetectionResults, DEFAULT_AUTO_DETECTION_CONFIG.autoLinkThreshold);
        
        if (suggestions.length === 0) {
            toast.info('No high-confidence suggestions available');
            return;
        }

        const linkInputs = suggestions.map(suggestion => ({
            diagram_id: diagramId,
            element_id: suggestion.elementId,
            requirement_id: suggestion.requirementId,
            link_type: 'auto_detected' as const,
            metadata: {
                confidence_score: suggestion.confidence,
                auto_detected_pattern: suggestion.reason,
            },
        }));

        bulkCreateMutation.mutate(linkInputs, {
            onSuccess: (result) => {
                toast.success(`Created ${result.processed} auto-detected links`);
                setShowAutoSuggestions(false);
            },
            onError: (error) => {
                toast.error(`Failed to create auto-detected links: ${error.message}`);
            },
        });
    }, [autoDetectionResults, diagramId, bulkCreateMutation]);

    // Calculate statistics
    const linkStats = {
        totalLinks: links.length,
        linkedElements: new Set(links.map(link => link.element_id)).size,
    };

    const autoSuggestionsCount = getAutoLinkSuggestions(
        autoDetectionResults, 
        DEFAULT_AUTO_DETECTION_CONFIG.minConfidence
    ).length;

    return (
        <div className={`relative ${className}`}>
            {/* Visual indicators for linked elements */}
            <ElementLinkIndicators
                elements={elements}
                appState={appState}
                links={links}
                onElementClick={handleNavigateToRequirement}
            />

            {/* Context menu */}
            <DiagramElementContextMenu
                state={contextMenu.state}
                onClose={contextMenu.closeMenu}
                onAction={handleContextMenuAction}
            />

            {/* Requirement selection dialog */}
            <RequirementLinkDialog
                state={requirementDialogState}
                onClose={() => setRequirementDialogState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleRequirementSelection}
                projectId={projectId}
                isLoading={createLinkMutation.isPending || updateLinkMutation.isPending}
            />

            {/* UI overlays */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
                {/* Link statistics */}
                <LinkStats
                    totalLinks={linkStats.totalLinks}
                    linkedElements={linkStats.linkedElements}
                />

                {/* Auto-detection suggestions */}
                <AutoDetectionBadge
                    suggestionsCount={autoSuggestionsCount}
                    onShowSuggestions={() => setShowAutoSuggestions(true)}
                />
            </div>

            {/* Auto-suggestions dialog */}
            {showAutoSuggestions && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
                        <h3 className="text-lg font-medium mb-4">Auto-detected Links</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Found {autoSuggestionsCount} potential requirement links. 
                            Would you like to create them automatically?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowAutoSuggestions(false)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcceptAutoSuggestions}
                                disabled={bulkCreateMutation.isPending}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {bulkCreateMutation.isPending ? 'Creating...' : 'Create Links'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DiagramElementLinkingSystem;
