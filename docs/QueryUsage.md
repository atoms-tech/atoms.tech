```typescript
// Simple equality filter
const documentsWithTag = useDocuments({
    filters: [{ field: 'tags', operator: 'contains', value: ['important'] }],
});

// Multiple filters with sorting and pagination
const filteredDocuments = useDocuments({
    filters: [
        { field: 'project_id', operator: 'eq', value: projectId },
        { field: 'created_at', operator: 'gte', value: startDate },
        { field: 'is_deleted', operator: 'eq', value: false },
    ],
    sort: [{ field: 'created_at', direction: 'desc' }],
    page: 1,
    pageSize: 20,
});

// Complex requirement filters
const requirements = useRequirements({
    filters: [
        { field: 'status', operator: 'in', value: ['DRAFT', 'IN_REVIEW'] },
        { field: 'priority', operator: 'gte', value: 'HIGH' },
        {
            field: 'tags',
            operator: 'overlaps',
            value: ['security', 'performance'],
        },
    ],
    sort: [
        { field: 'priority', direction: 'desc' },
        { field: 'created_at', direction: 'desc' },
    ],
});

// Text search with case-insensitive matching
const searchDocuments = useDocuments({
    filters: [{ field: 'name', operator: 'ilike', value: `%${searchTerm}%` }],
});

// Date range queries
const documentsInRange = useDocuments({
    filters: [
        {
            field: 'created_at',
            operator: 'range',
            value: [startDate, endDate],
        },
    ],
});
```
