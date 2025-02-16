import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Database } from '@/types/base/database.types';
import { Sort } from '@/types/base/filters.types';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

type TableName = keyof Database['public']['Tables'];
type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];

type FilterValue = string | number | boolean | null | Array<string | number | boolean | null>;

// Type for query operations that can be performed
type QueryOperations<T extends TableName> = {
    eq: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    neq: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    gt: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    gte: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    lt: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    lte: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    like: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    ilike: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    in: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    contains: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
    overlaps: (column: keyof Row<T> & string, value: FilterValue) => QueryBuilder<T>;
};

export interface Filter<T extends TableName> {
    field: keyof Row<T> & string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains' | 'overlaps' | 'range';
    value: FilterValue;
}

export interface QueryFilters<T extends TableName> {
    filters?: Filter<T>[];
    sort?: Sort[];
    page?: number;
    pageSize?: number;
}

type QueryBuilder<T extends TableName> = PostgrestFilterBuilder<
    Database['public'],
    Row<T>,
    Row<T>[],
    T,
    { [k in T]: { Row: Row<T> } }
>;

export function applyFilter<T extends TableName>(
    query: QueryBuilder<T>,
    filter: Filter<T>,
): QueryBuilder<T> {
    const { field, operator, value } = filter;

    // Cast to our known operations type instead of any
    const typedQuery = query as unknown as QueryOperations<T>;

    switch (operator) {
        case 'eq':
            return typedQuery.eq(field, value);
        case 'neq':
            return typedQuery.neq(field, value);
        case 'gt':
            return typedQuery.gt(field, value);
        case 'gte':
            return typedQuery.gte(field, value);
        case 'lt':
            return typedQuery.lt(field, value);
        case 'lte':
            return typedQuery.lte(field, value);
        case 'like':
            return typedQuery.like(field, value);
        case 'ilike':
            return typedQuery.ilike(field, value);
        case 'in':
            return typedQuery.in(field, value);
        case 'contains':
            return typedQuery.contains(field, value);
        case 'overlaps':
            return typedQuery.overlaps(field, value);
        case 'range':
            const [start, end] = value as [string | number, string | number];
            return typedQuery.gte(field, start).lte(field, end);
        default:
            return query;
    }
}

export function applySort<T extends TableName>(
    query: QueryBuilder<T>,
    sort: Sort,
): QueryBuilder<T> {
    return query.order(sort.field, { ascending: sort.direction === 'asc' });
}

export function applyPagination<T extends TableName>(
    query: QueryBuilder<T>,
    page?: number,
    pageSize?: number,
): QueryBuilder<T> {
    if (page !== undefined && pageSize !== undefined) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;
        return query.range(start, end);
    }
    return query;
}

export async function buildQuery<T extends TableName>(
    table: T,
    queryFilters?: QueryFilters<T>,
    select: string = '*',
) {
    let query = supabase.from(table).select(select) as QueryBuilder<T>;

    if (queryFilters?.filters) {
        queryFilters.filters.forEach((filter) => {
            query = applyFilter(query, filter);
        });
    }

    if (queryFilters?.sort) {
        queryFilters.sort.forEach((sort) => {
            query = applySort(query, sort);
        });
    }

    if (queryFilters?.page && queryFilters?.pageSize) {
        query = applyPagination(
            query,
            queryFilters.page,
            queryFilters.pageSize,
        );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
        data: data as Row<T>[],
        error,
        count,
    };
}
