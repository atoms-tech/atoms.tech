export type FilterOperator =
    | 'eq' // equals
    | 'neq' // not equals
    | 'gt' // greater than
    | 'gte' // greater than or equal
    | 'lt' // less than
    | 'lte' // less than or equal
    | 'like' // LIKE pattern matching
    | 'ilike' // case insensitive LIKE
    | 'in' // in array
    | 'contains' // array contains
    | 'overlaps' // array overlaps
    | 'range'; // between range

export type Filter = {
    field: string;
    operator: FilterOperator;
    value: any;
};

export type SortDirection = 'asc' | 'desc';

export type Sort = {
    field: string;
    direction: SortDirection;
};

export type QueryFilters = {
    filters?: Filter[];
    sort?: Sort[];
    page?: number;
    pageSize?: number;
};
