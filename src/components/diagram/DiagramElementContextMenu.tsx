'use client';

import React, { useEffect, useRef } from 'react';
import { Link, ExternalLink, Edit, Trash2, Copy, Eye, Plus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { 
    ElementContextMenuState, 
    DiagramElementLink,
    ElementContextMenuAction 
} from '@/types/diagram-element-links.types';

interface DiagramElementContextMenuProps {
    state: ElementContextMenuState;
    onClose: () => void;
    onAction: (action: ElementContextMenuAction, elementId: string, existingLink?: DiagramElementLink) => void;
    className?: string;
}

export function DiagramElementContextMenu({
    state,
    onClose,
    onAction,
    className = '',
}: DiagramElementContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (state.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [state.isOpen, onClose]);

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (state.isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [state.isOpen, onClose]);

    if (!state.isOpen || !state.elementId) {
        return null;
    }

    const hasExistingLink = !!state.existingLink;
    const elementText = state.elementText || 'Element';
    const truncatedText = elementText.length > 30 ? `${elementText.substring(0, 30)}...` : elementText;

    const handleAction = (action: ElementContextMenuAction) => {
        onAction(action, state.elementId!, state.existingLink);
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className={`fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[200px] ${className}`}
            style={{
                left: state.position.x,
                top: state.position.y,
            }}
        >
            <div className="py-1">
                {/* Header with element info */}
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <div className="font-medium">Element: {state.elementType || 'Unknown'}</div>
                    {elementText && (
                        <div className="truncate" title={elementText}>
                            "{truncatedText}"
                        </div>
                    )}
                </div>

                {/* Link Actions */}
                {!hasExistingLink ? (
                    <button
                        onClick={() => handleAction('add_link')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Link to Requirement
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => handleAction('navigate_to_requirement')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Go to Requirement
                        </button>
                        
                        <button
                            onClick={() => handleAction('edit_link')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Link
                        </button>

                        <button
                            onClick={() => handleAction('copy_link')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Link
                        </button>

                        <DropdownMenuSeparator />

                        <button
                            onClick={() => handleAction('remove_link')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove Link
                        </button>
                    </>
                )}

                {/* Additional Actions */}
                <DropdownMenuSeparator />
                
                <button
                    onClick={() => handleAction('view_all_links')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                    <Eye className="w-4 h-4" />
                    View All Links
                </button>
            </div>

            {/* Link Info Footer */}
            {hasExistingLink && state.existingLink && (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="font-medium">Linked to:</div>
                    <div className="truncate">
                        {/* We'll need to get requirement name from the link data */}
                        Requirement {state.existingLink.requirement_id.substring(0, 8)}...
                    </div>
                    <div className="text-xs opacity-75">
                        {state.existingLink.link_type === 'auto_detected' ? 'Auto-detected' : 'Manual'}
                    </div>
                </div>
            )}
        </div>
    );
}

// Hook for managing context menu state
export function useElementContextMenu() {
    const [state, setState] = React.useState<ElementContextMenuState>({
        isOpen: false,
        position: { x: 0, y: 0 },
        elementId: null,
        existingLink: null,
    });

    const openMenu = React.useCallback((
        position: { x: number; y: number },
        elementId: string,
        elementType?: string,
        elementText?: string,
        existingLink?: DiagramElementLink
    ) => {
        setState({
            isOpen: true,
            position,
            elementId,
            elementType,
            elementText,
            existingLink,
        });
    }, []);

    const closeMenu = React.useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        state,
        openMenu,
        closeMenu,
    };
}

export default DiagramElementContextMenu;
