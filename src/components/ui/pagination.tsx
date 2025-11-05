'use client';

/**
 * Pagination Component
 * 
 * A reusable pagination component for navigating through pages of content
 */

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    showPageSizeSelector?: boolean;
    pageSizeOptions?: number[];
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    showPageSizeSelector = false,
    pageSizeOptions = [9, 18, 27, 36],
    className,
}: PaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange(page);
        }
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalPages <= 1 && !showPageSizeSelector) {
        return null;
    }

    return (
        <div className={cn('flex items-center justify-between gap-4', className)}>
            {/* Page info */}
            <div className="text-sm text-muted-foreground">
                Showing {startItem} to {endItem} of {totalItems} items
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                {/* Previous button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                                    ...
                                </span>
                            );
                        }

                        const pageNum = page as number;
                        const isActive = pageNum === currentPage;

                        return (
                            <Button
                                key={pageNum}
                                variant={isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePageClick(pageNum)}
                                className={cn('h-8 min-w-8 px-3', isActive && 'pointer-events-none')}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                </div>

                {/* Next button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                </Button>

                {/* Page size selector */}
                {showPageSizeSelector && onPageSizeChange && (
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-muted-foreground">Show:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
