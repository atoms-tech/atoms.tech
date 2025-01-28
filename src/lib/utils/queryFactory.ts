import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Filter, QueryFilters, Sort } from '@/types/base/filters.types';
import { Database } from '@/types/base/database.types';

type TableName = keyof Database['public']['Tables'];
type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
type QueryBuilder<T extends TableName> = PostgrestFilterBuilder<
    Database['public'],
    Row<T>,
    Row<T>[],
    T,
    { [k in T]: { Row: Row<T> } }
>;

export function applyFilter<T extends TableName>(
    query: QueryBuilder<T>,
    filter: Filter,
): QueryBuilder<T> {
    const { field, operator, value } = filter;

    switch (operator) {
        case 'eq':
            return query.eq(field, value);
        case 'neq':
            return query.neq(field, value);
        case 'gt':
            return query.gt(field, value);
        case 'gte':
            return query.gte(field, value);
        case 'lt':
            return query.lt(field, value);
        case 'lte':
            return query.lte(field, value);
        case 'like':
            return query.like(field, value);
        case 'ilike':
            return query.ilike(field, value);
        case 'in':
            return query.in(field, value);
        case 'contains':
            return query.contains(field, value);
        case 'overlaps':
            return query.overlaps(field, value);
        case 'range':
            return query.gte(field, value[0]).lte(field, value[1]);
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
    queryFilters?: QueryFilters,
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
