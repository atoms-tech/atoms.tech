import React from 'react';

interface TableBlockLoadingStateProps {
    isLoading: boolean;
    isError: boolean;
    error: Error | unknown;
}

export const TableBlockLoadingState: React.FC<TableBlockLoadingStateProps> = ({
    isLoading,
    isError,
}) => {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-24 bg-muted rounded-lg" />
                <div className="h-24 bg-muted rounded-lg" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 text-center text-red-500">
                Error loading properties. Please try refreshing the page.
            </div>
        );
    }

    return null;
};
