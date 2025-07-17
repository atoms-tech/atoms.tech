interface TableLoadingSkeletonProps {
    columns: number;
    rows?: number;
}

export function TableLoadingSkeleton({
    columns: _columns,
    rows = 5,
}: TableLoadingSkeletonProps) {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded-lg" />
            <div className="space-y-2">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg" />
                ))}
            </div>
        </div>
    );
}
