interface EmptyStateProps {
    message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
    return <div className="text-center py-8 text-muted-foreground">{message}</div>;
}
