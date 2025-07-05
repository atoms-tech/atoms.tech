'use client';

import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type {
    AppState,
    ExcalidrawImperativeAPI,
} from '@excalidraw/excalidraw/types';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { CustomContextMenu } from '@/components/custom/Excalidraw/CustomContextMenu';
import { RequirementSearchModalTest } from '@/components/custom/Excalidraw/RequirementSearchModalTest';
import { Requirement } from '@/types/base/requirements.types';

import '@excalidraw/excalidraw/index.css';
import '@/styles/excalidraw-custom.css';

export default function ExcalidrawTestWrapper() {
    const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);
    const { theme, resolvedTheme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Context menu and requirement linking state
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        elementId: string | null;
    } | null>(null);
    const [isRequirementSearchOpen, setIsRequirementSearchOpen] = useState(false);
    const [selectedElementForLinking, setSelectedElementForLinking] = useState<string | null>(null);

    // Update dark mode state whenever theme changes
    useEffect(() => {
        setIsDarkMode(theme === 'dark' || resolvedTheme === 'dark');
    }, [theme, resolvedTheme]);

    // Helper functions for element metadata
    const getElementRequirementLink = (elementId: string): { requirement: Requirement; url: string } | null => {
        if (!excalidrawApiRef.current) return null;
        
        const elements = excalidrawApiRef.current.getSceneElements();
        const element = elements.find(el => el.id === elementId);
        
        if (!element || !element.customData?.requirementLink) return null;
        
        return element.customData.requirementLink;
    };

    const setElementRequirementLink = (elementId: string, requirement: Requirement, url: string) => {
        if (!excalidrawApiRef.current) return;
        
        const elements = excalidrawApiRef.current.getSceneElements();
        const elementIndex = elements.findIndex(el => el.id === elementId);
        
        if (elementIndex === -1) return;
        
        const updatedElements = [...elements];
        updatedElements[elementIndex] = {
            ...updatedElements[elementIndex],
            customData: {
                ...updatedElements[elementIndex].customData,
                requirementLink: { requirement, url }
            }
        };
        
        excalidrawApiRef.current.updateScene({ elements: updatedElements });
    };

    // Handle right-click for context menu
    const handlePointerDown = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (activeTool: any, pointerDownState: any) => {
            // Check if it's a right-click
            if (pointerDownState.button === 2) {
                const { x, y } = pointerDownState.origin;
                
                // Get the element at this position
                const elements = excalidrawApiRef.current?.getSceneElements() || [];
                const hitElement = elements.find(element => {
                    // Simple hit detection - you might want to use Excalidraw's built-in hit detection
                    return (
                        x >= element.x &&
                        x <= element.x + element.width &&
                        y >= element.y &&
                        y <= element.y + element.height
                    );
                });

                setContextMenu({
                    x: pointerDownState.clientX,
                    y: pointerDownState.clientY,
                    elementId: hitElement?.id || null,
                });
            }
        },
        [],
    );

    // Handle requirement linking
    const handleLinkToRequirement = useCallback(() => {
        if (contextMenu?.elementId) {
            setSelectedElementForLinking(contextMenu.elementId);
            setIsRequirementSearchOpen(true);
        }
        setContextMenu(null);
    }, [contextMenu]);

    // Handle requirement selection
    const handleRequirementSelect = useCallback((requirement: Requirement, url: string) => {
        if (selectedElementForLinking) {
            setElementRequirementLink(selectedElementForLinking, requirement, url);
        }
        setIsRequirementSearchOpen(false);
        setSelectedElementForLinking(null);
    }, [selectedElementForLinking]);

    // Handle opening external requirement link
    const handleOpenExternalLink = useCallback(() => {
        if (contextMenu?.elementId) {
            const link = getElementRequirementLink(contextMenu.elementId);
            if (link?.url) {
                window.open(link.url, '_blank');
            }
        }
        setContextMenu(null);
    }, [contextMenu]);

    const handleChange = useCallback(
        (elements: readonly ExcalidrawElement[], appState: AppState) => {
            // Handle changes if needed
            console.log('Excalidraw changed:', { elements: elements.length, appState });
        },
        [],
    );

    return (
        <div className="h-full w-full min-h-[500px] relative excalidraw-wrapper">
            <Excalidraw
                onChange={handleChange}
                initialData={{
                    appState: {
                        theme: isDarkMode ? 'dark' : 'light',
                        viewBackgroundColor: isDarkMode 
                            ? 'hsl(240, 10%, 3.9%)' 
                            : 'hsl(0, 0%, 100%)',
                    },
                }}
                theme={isDarkMode ? 'dark' : 'light'}
                excalidrawAPI={(api) => {
                    excalidrawApiRef.current = api;
                }}
                onPointerDown={handlePointerDown}
                UIOptions={{
                    canvasActions: {
                        changeViewBackgroundColor: true,
                        clearCanvas: true,
                        export: {
                            saveFileToDisk: true,
                        },
                        loadScene: true,
                        saveToActiveFile: true,
                        toggleTheme: false, // We handle theme via our own system
                        saveAsImage: true,
                    },
                }}
            >
                <MainMenu>
                    <MainMenu.DefaultItems.LoadScene />
                    <MainMenu.DefaultItems.SaveToActiveFile />
                    <MainMenu.DefaultItems.SaveAsImage />
                    <MainMenu.DefaultItems.ClearCanvas />
                    <MainMenu.DefaultItems.Export />
                    <MainMenu.Item
                        onSelect={() => {
                            if (excalidrawApiRef.current) {
                                excalidrawApiRef.current.updateScene({
                                    appState: {
                                        viewBackgroundColor: isDarkMode 
                                            ? 'hsl(240, 10%, 3.9%)' 
                                            : 'hsl(0, 0%, 100%)',
                                    },
                                });
                            }
                        }}
                    >
                        Reset Background
                    </MainMenu.Item>
                </MainMenu>
            </Excalidraw>

            {/* Custom Context Menu */}
            {contextMenu && (
                <CustomContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onLinkToRequirement={handleLinkToRequirement}
                    onOpenExternalLink={handleOpenExternalLink}
                    hasExistingLink={!!getElementRequirementLink(contextMenu.elementId || '')}
                    existingLinkUrl={getElementRequirementLink(contextMenu.elementId || '')?.url}
                />
            )}

            {/* Requirement Search Modal */}
            <RequirementSearchModalTest
                isOpen={isRequirementSearchOpen}
                onClose={() => {
                    setIsRequirementSearchOpen(false);
                    setSelectedElementForLinking(null);
                }}
                onSelectRequirement={handleRequirementSelect}
                currentLink={selectedElementForLinking ? getElementRequirementLink(selectedElementForLinking)?.url : undefined}
            />
        </div>
    );
}
