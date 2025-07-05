'use client';

import { Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: string;
    type: 'organization' | 'project' | 'document' | 'requirement' | 'member';
    title: string;
    subtitle?: string;
    context?: string;
    url: string;
}

interface ContextualSearchProps {
    placeholder: string;
    scope: string;
    className?: string;
    onSearch?: (query: string) => void;
    onSelect?: (result: SearchResult) => void;
}

export function ContextualSearch({
    placeholder,
    scope: _scope,
    className,
    onSearch,
    onSelect,
}: ContextualSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Mock search function - replace with actual search service
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            const mockResults: SearchResult[] = [
                {
                    id: '1',
                    type: 'project' as const,
                    title: 'API Requirements',
                    subtitle: 'Updated 2 hours ago',
                    context: 'Engineering Team',
                    url: '/org/123/project/456',
                },
                {
                    id: '2',
                    type: 'document' as const,
                    title: 'Security Review Notes',
                    subtitle: 'Updated yesterday',
                    context: 'Project Alpha',
                    url: '/org/123/project/456/doc/789',
                },
                {
                    id: '3',
                    type: 'requirement' as const,
                    title: 'Database Schema Updates',
                    subtitle: 'High priority',
                    context: 'Backend Team',
                    url: '/org/123/requirements/101',
                },
            ].filter(
                (result) =>
                    result.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    result.context
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()),
            );

            setResults(mockResults);
            setIsLoading(false);
        }, 300);
    }, []);

    const handleQueryChange = useCallback(
        (value: string) => {
            setQuery(value);
            onSearch?.(value);
            performSearch(value);
        },
        [onSearch, performSearch],
    );

    const handleSelect = useCallback(
        (result: SearchResult) => {
            onSelect?.(result);
            setOpen(false);
            setQuery('');
            setResults([]);
        },
        [onSelect],
    );

    const getTypeIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'organization':
                return '🏢';
            case 'project':
                return '📁';
            case 'document':
                return '📄';
            case 'requirement':
                return '📋';
            case 'member':
                return '👤';
            default:
                return '📄';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent/50 cursor-pointer transition-colors',
                        className,
                    )}
                >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground flex-1 text-left">
                        {placeholder}
                    </span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        ⌘K
                    </kbd>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder={placeholder}
                            className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        {query && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    setResults([]);
                                }}
                                className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <CommandList>
                        {isLoading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Searching...
                            </div>
                        )}
                        {!isLoading && query && results.length === 0 && (
                            <CommandEmpty>No results found.</CommandEmpty>
                        )}
                        {!isLoading && results.length > 0 && (
                            <CommandGroup>
                                {results.map((result) => (
                                    <CommandItem
                                        key={result.id}
                                        onSelect={() => handleSelect(result)}
                                        className="flex items-center gap-3 px-3 py-2"
                                    >
                                        <span className="text-lg">
                                            {getTypeIcon(result.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">
                                                {result.title}
                                            </div>
                                            {result.subtitle && (
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {result.subtitle}
                                                </div>
                                            )}
                                        </div>
                                        {result.context && (
                                            <div className="text-xs text-muted-foreground">
                                                {result.context}
                                            </div>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {!query && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Start typing to search...
                            </div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
