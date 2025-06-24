'use client';

import React, { useMemo } from 'react';
import { Link, ExternalLink, AlertCircle } from 'lucide-react';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState } from '@excalidraw/excalidraw/types';
import type { DiagramElementLink, LinkedElementIndicator } from '@/types/diagram-element-links.types';

interface ElementLinkIndicatorsProps {
    elements: readonly ExcalidrawElement[];
    appState: AppState;
    links: DiagramElementLink[];
    onElementClick?: (elementId: string, requirementId: string) => void;
    className?: string;
}

interface LinkIndicatorProps {
    indicator: LinkedElementIndicator;
    appState: AppState;
    onClick?: (elementId: string, requirementId: string) => void;
}

function LinkIndicator({ indicator, appState, onClick }: LinkIndicatorProps) {
    // Calculate screen position based on canvas transform
    const screenX = (indicator.position.x - appState.scrollX) * appState.zoom.value;
    const screenY = (indicator.position.y - appState.scrollY) * appState.zoom.value;
    const screenWidth = indicator.position.width * appState.zoom.value;
    const screenHeight = indicator.position.height * appState.zoom.value;

    // Don't render if element is too small or off-screen
    if (screenWidth < 10 || screenHeight < 10) return null;
    if (screenX + screenWidth < 0 || screenY + screenHeight < 0) return null;
    if (screenX > window.innerWidth || screenY > window.innerHeight) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick(indicator.elementId, indicator.requirementId);
        }
    };

    return (
        <>
            {/* Link indicator icon */}
            <div
                className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 ${
                    indicator.isHovered ? 'scale-110' : ''
                }`}
                style={{
                    left: screenX + screenWidth - 20,
                    top: screenY - 8,
                    zIndex: 1000,
                }}
                onClick={handleClick}
                title={`Linked to: ${indicator.requirementName}`}
            >
                <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg hover:bg-blue-600 transition-colors">
                    <Link className="w-3 h-3" />
                </div>
            </div>

            {/* Subtle border overlay */}
            <div
                className="absolute pointer-events-none border-2 border-blue-400 rounded opacity-60"
                style={{
                    left: screenX - 1,
                    top: screenY - 1,
                    width: screenWidth + 2,
                    height: screenHeight + 2,
                    zIndex: 999,
                }}
            />

            {/* Hover tooltip */}
            {indicator.isHovered && (
                <div
                    className="absolute pointer-events-none bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-[1001] whitespace-nowrap"
                    style={{
                        left: screenX + screenWidth + 8,
                        top: screenY,
                    }}
                >
                    <div className="font-medium">{indicator.requirementName}</div>
                    <div className="text-gray-300">Click to navigate</div>
                </div>
            )}
        </>
    );
}

export function ElementLinkIndicators({
    elements,
    appState,
    links,
    onElementClick,
    className = '',
}: ElementLinkIndicatorsProps) {
    // Create indicators for linked elements
    const indicators = useMemo((): LinkedElementIndicator[] => {
        const indicatorMap = new Map<string, LinkedElementIndicator>();

        // Group links by element ID
        const linksByElement = links.reduce((acc, link) => {
            if (!acc[link.element_id]) {
                acc[link.element_id] = [];
            }
            acc[link.element_id].push(link);
            return acc;
        }, {} as Record<string, DiagramElementLink[]>);

        // Create indicators for elements that have links
        elements.forEach(element => {
            const elementLinks = linksByElement[element.id];
            if (!elementLinks || elementLinks.length === 0) return;

            // Use the first link for the indicator (could be enhanced to show multiple)
            const primaryLink = elementLinks[0];
            
            indicatorMap.set(element.id, {
                elementId: element.id,
                requirementId: primaryLink.requirement_id,
                requirementName: `Requirement ${primaryLink.requirement_id.substring(0, 8)}...`, // Will be enhanced with actual name
                position: {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                },
                isHovered: false, // Will be managed by hover state
            });
        });

        return Array.from(indicatorMap.values());
    }, [elements, links]);

    // Don't render anything if no indicators
    if (indicators.length === 0) return null;

    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
            {indicators.map(indicator => (
                <LinkIndicator
                    key={indicator.elementId}
                    indicator={indicator}
                    appState={appState}
                    onClick={onElementClick}
                />
            ))}
        </div>
    );
}

// Hook for managing hover state of link indicators
export function useLinkIndicatorHover() {
    const [hoveredElementId, setHoveredElementId] = React.useState<string | null>(null);

    const handleMouseEnter = React.useCallback((elementId: string) => {
        setHoveredElementId(elementId);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
        setHoveredElementId(null);
    }, []);

    return {
        hoveredElementId,
        handleMouseEnter,
        handleMouseLeave,
    };
}

// Component for showing link statistics in a corner
interface LinkStatsProps {
    totalLinks: number;
    linkedElements: number;
    className?: string;
}

export function LinkStats({ totalLinks, linkedElements, className = '' }: LinkStatsProps) {
    if (totalLinks === 0) return null;

    return (
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm ${className}`}>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Link className="w-3 h-3" />
                <span>{totalLinks} links</span>
                <span className="text-gray-400">•</span>
                <span>{linkedElements} elements</span>
            </div>
        </div>
    );
}

// Component for showing auto-detection suggestions
interface AutoDetectionBadgeProps {
    suggestionsCount: number;
    onShowSuggestions?: () => void;
    className?: string;
}

export function AutoDetectionBadge({ 
    suggestionsCount, 
    onShowSuggestions, 
    className = '' 
}: AutoDetectionBadgeProps) {
    if (suggestionsCount === 0) return null;

    return (
        <button
            onClick={onShowSuggestions}
            className={`bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg p-2 shadow-sm hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors ${className}`}
        >
            <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{suggestionsCount} suggested links</span>
                <ExternalLink className="w-3 h-3" />
            </div>
        </button>
    );
}

export default ElementLinkIndicators;
