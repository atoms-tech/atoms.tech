import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDebounceSearchOptions {
    delay?: number;
    minLength?: number;
}

interface UseDebounceSearchReturn<T> {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    debouncedQuery: string;
    isSearching: boolean;
    results: T[];
    setResults: (results: T[]) => void;
    clearSearch: () => void;
    abortSearch: () => void;
}

export function useDebounceSearch<T = unknown>(
    searchFunction?: (query: string, signal: AbortSignal) => Promise<T[]>,
    options: UseDebounceSearchOptions = {},
): UseDebounceSearchReturn<T> {
    const { delay = 300, minLength = 1 } = options;

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<T[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce the search query
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [searchQuery, delay]);

    // Perform search when debounced query changes
    useEffect(() => {
        if (!searchFunction) return;

        // Abort previous search
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Don't search if query is too short
        if (debouncedQuery.length < minLength) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsSearching(true);

        searchFunction(debouncedQuery, signal)
            .then((searchResults) => {
                if (!signal.aborted) {
                    setResults(searchResults);
                    setIsSearching(false);
                }
            })
            .catch((error) => {
                if (!signal.aborted) {
                    console.error('Search error:', error);
                    setResults([]);
                    setIsSearching(false);
                }
            });

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [debouncedQuery, searchFunction, minLength]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setDebouncedQuery('');
        setResults([]);
        setIsSearching(false);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const abortSearch = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsSearching(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        debouncedQuery,
        isSearching,
        results,
        setResults,
        clearSearch,
        abortSearch,
    };
}
