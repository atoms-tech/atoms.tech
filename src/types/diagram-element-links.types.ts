// Types for diagram element linking functionality

export interface DiagramElementLink {
    id: string;
    diagram_id: string;
    element_id: string; // Excalidraw element ID
    requirement_id: string;
    link_type: 'manual' | 'auto_detected';
    metadata?: {
        element_type?: string;
        element_text?: string;
        confidence_score?: number;
        auto_detected_pattern?: string;
    };
    created_at: string;
    updated_at: string;
    created_by: string;
}

export interface CreateDiagramElementLinkInput {
    diagram_id: string;
    element_id: string;
    requirement_id: string;
    link_type?: 'manual' | 'auto_detected';
    metadata?: DiagramElementLink['metadata'];
}

export interface UpdateDiagramElementLinkInput {
    id: string;
    requirement_id?: string;
    link_type?: 'manual' | 'auto_detected';
    metadata?: DiagramElementLink['metadata'];
}

// Context menu position and state
export interface ElementContextMenuState {
    isOpen: boolean;
    position: { x: number; y: number };
    elementId: string | null;
    elementType?: string;
    elementText?: string;
    existingLink?: DiagramElementLink | null;
}

// Requirement selection dialog state
export interface RequirementSelectionState {
    isOpen: boolean;
    elementId: string | null;
    existingLink?: DiagramElementLink | null;
    searchQuery: string;
    selectedRequirementId: string | null;
}

// Visual indicator state for linked elements
export interface LinkedElementIndicator {
    elementId: string;
    requirementId: string;
    requirementName: string;
    position: { x: number; y: number; width: number; height: number };
    isHovered: boolean;
}

// Label parser types
export interface RequirementPattern {
    pattern: RegExp;
    type: 'requirement_id' | 'requirement_name' | 'keyword';
    confidence: number;
}

export interface DetectedRequirementMatch {
    text: string;
    pattern: RequirementPattern;
    confidence: number;
    requirementId?: string;
    startIndex: number;
    endIndex: number;
}

export interface LabelParserResult {
    elementId: string;
    elementText: string;
    matches: DetectedRequirementMatch[];
    suggestedLinks: {
        requirementId: string;
        confidence: number;
        reason: string;
    }[];
}

// Extended Excalidraw element with link metadata
export interface ExcalidrawElementWithLinks {
    id: string;
    type: string;
    text?: string;
    links?: DiagramElementLink[];
    hasLinks: boolean;
    primaryLink?: DiagramElementLink;
}

// Context menu action types
export type ElementContextMenuAction = 
    | 'add_link'
    | 'edit_link'
    | 'remove_link'
    | 'navigate_to_requirement'
    | 'copy_link'
    | 'view_all_links';

// Event types for element linking
export interface ElementLinkEvent {
    type: 'link_created' | 'link_updated' | 'link_deleted' | 'link_navigated';
    elementId: string;
    requirementId: string;
    diagramId: string;
    timestamp: string;
}

// Configuration for auto-detection
export interface AutoDetectionConfig {
    enabled: boolean;
    patterns: RequirementPattern[];
    minConfidence: number;
    autoLinkThreshold: number;
    showSuggestions: boolean;
}

// Bulk operations
export interface BulkLinkOperation {
    action: 'create' | 'update' | 'delete';
    links: CreateDiagramElementLinkInput[] | UpdateDiagramElementLinkInput[] | string[];
}

export interface BulkLinkResult {
    success: boolean;
    processed: number;
    errors: Array<{
        index: number;
        error: string;
    }>;
}
