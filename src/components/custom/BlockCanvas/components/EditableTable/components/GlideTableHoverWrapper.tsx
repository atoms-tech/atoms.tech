import React, { useCallback, useEffect, useRef, useState } from 'react';

interface GlideTableHoverWrapperProps {
    children: React.ReactNode;
    _onCellSelected?: (row: number, col: number) => void;
    onExpandRow?: (rowIndex: number) => void;
    sortedData?: unknown[];
}

export const GlideTableHoverWrapper = React.forwardRef<
    HTMLDivElement,
    GlideTableHoverWrapperProps
>(({ children, _onCellSelected, onExpandRow, sortedData }, ref) => {
    const [show, setShow] = useState(false);
    const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(
        null,
    );
    const menuRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Combine external ref with internal ref
    React.useImperativeHandle(ref, () => wrapperRef.current!, []);

    // Function to hide buttons
    const hideButtons = useCallback(() => {
        console.log('hideButtons called');
        setShow(false);
        setSelectedCell(null);
    }, []);

    // Function to be called from parent when cell is activated
    const showButtonsForCell = useCallback(
        (row: number, col: number, clientX?: number, clientY?: number) => {
            console.log('showButtonsForCell called with:', {
                row,
                col,
                clientX,
                clientY,
            });

            // Validate the row and column
            if (row < 0 || col < 0) {
                console.warn('Invalid cell coordinates:', { row, col });
                return;
            }

            // Check if we have valid data for this row
            if (sortedData && row >= sortedData.length) {
                console.warn('Row index out of bounds:', {
                    row,
                    dataLength: sortedData.length,
                });
                return;
            }

            // Check if this is the same cell as currently selected
            const isSameCell =
                selectedCell && selectedCell.row === row && selectedCell.col === col;

            if (isSameCell && show) {
                // Same cell activated while buttons are visible - hide them (toggle off)
                console.log('Same cell clicked, toggling buttons off');
                hideButtons();
                return;
            }

            // Set both state values in a single update to avoid timing issues
            const newSelectedCell = { row, col };
            setSelectedCell(newSelectedCell);

            // If we have coordinates, use them; otherwise position relative to wrapper
            if (clientX !== undefined && clientY !== undefined) {
                const newPos = {
                    x: clientX + 20,
                    y: clientY - 20,
                };
                console.log('Setting anchor position to:', newPos);
                setAnchorPos(newPos);
            } else {
                // Fallback positioning - estimate based on row/col
                const wrapper = wrapperRef.current;
                if (wrapper) {
                    const rect = wrapper.getBoundingClientRect();
                    const approxRowHeight = 40;
                    const approxColWidth = 120;
                    const fallbackPos = {
                        x: rect.left + col * approxColWidth + 100,
                        y: rect.top + 60 + row * approxRowHeight + 20,
                    };
                    console.log('Using fallback position:', fallbackPos);
                    setAnchorPos(fallbackPos);
                }
            }

            console.log('About to set show to true for cell:', newSelectedCell);
            setShow(true);
            console.log('Show state set to true');
        },
        [selectedCell, show, hideButtons, sortedData],
    );

    // Expose functions to parent component
    useEffect(() => {
        if (wrapperRef.current) {
            (
                wrapperRef.current as unknown as Record<string, unknown>
            ).showButtonsForCell = showButtonsForCell;
            (wrapperRef.current as unknown as Record<string, unknown>).hideButtons =
                hideButtons;
        }
    }, [showButtonsForCell, hideButtons]);

    // Handle clicks on the wrapper - simplified to only handle menu hiding
    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Don't hide if clicking on menu
        if (menuRef.current?.contains(target)) {
            return;
        }

        // Let Glide handle cell activation - we only handle non-cell clicks here
        const isGlideCanvas =
            target.tagName === 'CANVAS' ||
            target.closest('canvas') ||
            target.closest('.gdg-cell') ||
            target.closest('[role="gridcell"]') ||
            target.classList.contains('gdg-cell') ||
            target.closest('.gdg-growing-entry') ||
            target.classList.contains('dvn-scroller') ||
            target.closest('.dvn-scroller') ||
            target.closest('[class*="gdg-"]') ||
            target.parentElement?.className.includes('gdg-');

        if (!isGlideCanvas) {
            // Only hide if clicking outside the grid area
            console.log('Clicked outside grid area, hiding buttons');
            hideButtons();
        }
        // Note: All cell clicks are now handled by Glide's onCellActivated event
    };

    // Global click listener to hide buttons when clicking outside the component
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Don't hide if clicking within our wrapper or menu
            if (
                wrapperRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            // Hide buttons when clicking outside
            hideButtons();
        };

        // Only add global listener if show is true
        if (show) {
            // Add with a small delay to avoid immediate triggering
            const timeoutId = setTimeout(() => {
                document.addEventListener('click', handleGlobalClick);
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('click', handleGlobalClick);
            };
        }
    }, [show, hideButtons]);

    // Separate effect for capture phase listener (always active)
    useEffect(() => {
        // TEMPORARILY DISABLE CAPTURE LISTENER TO DEBUG STATE ISSUE
        console.log('Capture listener disabled for debugging');
        return () => {};
    }, []);

    return (
        <div
            ref={wrapperRef}
            onClick={handleWrapperClick}
            className="relative w-full h-full"
        >
            {children}

            {/* Hover menu */}
            {show && selectedCell ? (
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        left: `${anchorPos.x}px`,
                        top: `${anchorPos.y}px`,
                        zIndex: 9999,
                        minWidth: '120px',
                    }}
                    className="bg-background border border-border rounded-lg shadow-lg p-2 flex flex-col gap-1"
                    onClick={(e) => e.stopPropagation()}
                    data-menu="true"
                >
                    <button
                        className="px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-left"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Trace clicked for row:', selectedCell.row);
                            // TODO: Implement trace functionality
                            hideButtons();
                        }}
                    >
                        Trace
                    </button>
                    <button
                        className="px-3 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-left"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(
                                'Expand clicked for row:',
                                selectedCell.row,
                                'sortedData length:',
                                sortedData?.length,
                            );

                            // Validate the selected cell before proceeding
                            if (
                                selectedCell.row < 0 ||
                                (sortedData && selectedCell.row >= sortedData.length)
                            ) {
                                console.error(
                                    'Invalid row index:',
                                    selectedCell.row,
                                    'Data length:',
                                    sortedData?.length,
                                );
                                hideButtons();
                                return;
                            }

                            // Call the onExpandRow callback to open the sidebar (same as double-click)
                            if (onExpandRow) {
                                console.log(
                                    'Calling onExpandRow with validated row index:',
                                    selectedCell.row,
                                );
                                onExpandRow(selectedCell.row);
                            } else {
                                console.warn('onExpandRow callback not provided');
                            }

                            hideButtons();
                        }}
                    >
                        Expand
                    </button>
                </div>
            ) : null}
        </div>
    );
});

GlideTableHoverWrapper.displayName = 'GlideTableHoverWrapper';
