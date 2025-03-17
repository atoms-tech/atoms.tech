import type { FC } from 'react';

interface TableBlockLoadingStateProps {
    isLoading: boolean;
    isError: boolean;
    error: Error | unknown;
    onCreateDefaultSchemas: () => void;
    noSchemas: boolean;
}

export const TableBlockLoadingState: FC<TableBlockLoadingStateProps> = ({
    isLoading,
    isError,
    onCreateDefaultSchemas,
    noSchemas,
}) => {
    if (isLoading) {
        return (
            <div className="p-4 text-center">Loading property schemas...</div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 text-center text-red-500">
                Error loading property schemas. Please try refreshing the page.
            </div>
        );
    }

    if (noSchemas) {
        return (
            <div className="p-4 text-center">
                <p>No property schemas found for this table.</p>
                <button
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={onCreateDefaultSchemas}
                >
                    Create Default Schemas
                </button>
            </div>
        );
    }

    return null;
};
