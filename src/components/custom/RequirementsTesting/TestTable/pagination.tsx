'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
}: PaginationProps) {
    const startItem = (currentPage - 1) * 6 + 1;
    const endItem = Math.min(currentPage * 6, totalItems);

    return (
        <div className="flex justify-end items-center p-4 border-t">
            <div className="text-sm text-gray-500 mr-4">
                {startItem} to {endItem} of {totalItems}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                    ⟪
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                    ⟨
                </button>

                <div className="text-sm">
                    Page {currentPage} of {totalPages}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                    ⟩
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                    ⟫
                </button>
            </div>
        </div>
    );
}
