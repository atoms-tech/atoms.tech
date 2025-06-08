import {
    SlashCommand,
    SlashCommandRegistryEvent,
    SlashCommandRegistryEventListener,
    SlashCommandRegistryOptions,
    SlashCommandSearchResult,
} from '@/components/ui/slash-commands/types';

/**
 * Central registry for managing slash commands
 */
export class SlashCommandRegistry {
    private commands = new Map<string, SlashCommand>();
    private listeners = new Set<SlashCommandRegistryEventListener>();
    private options: Required<SlashCommandRegistryOptions>;

    constructor(options: SlashCommandRegistryOptions = {}) {
        this.options = {
            maxResults: options.maxResults ?? 10,
            minQueryLength: options.minQueryLength ?? 0,
            searchDebounce: options.searchDebounce ?? 150,
        };
    }

    /**
     * Register a new command
     */
    register(command: SlashCommand): void {
        if (this.commands.has(command.id)) {
            console.warn(`Command with id "${command.id}" is already registered`);
            return;
        }

        this.commands.set(command.id, command);
        this.emit({ type: 'command-registered', command });
    }

    /**
     * Register multiple commands at once
     */
    registerMany(commands: SlashCommand[]): void {
        commands.forEach((command) => this.register(command));
    }

    /**
     * Unregister a command
     */
    unregister(commandId: string): boolean {
        const removed = this.commands.delete(commandId);
        if (removed) {
            this.emit({ type: 'command-unregistered', commandId });
        }
        return removed;
    }

    /**
     * Get a command by ID
     */
    getCommand(commandId: string): SlashCommand | undefined {
        return this.commands.get(commandId);
    }

    /**
     * Get all registered commands
     */
    getAllCommands(): SlashCommand[] {
        return Array.from(this.commands.values());
    }

    /**
     * Search commands by query with relevance scoring
     */
    search(query: string, context?: unknown): SlashCommandSearchResult[] {
        if (query.length < this.options.minQueryLength) {
            return [];
        }

        const normalizedQuery = query.toLowerCase().trim();
        const results: SlashCommandSearchResult[] = [];

        for (const command of this.commands.values()) {
            // Check if command is available in current context
            if (command.isAvailable && context && !command.isAvailable(context)) {
                continue;
            }

            const relevance = this.calculateRelevance(command, normalizedQuery);
            if (relevance > 0) {
                results.push({
                    command,
                    relevance,
                    matchedKeywords: this.getMatchedKeywords(command, normalizedQuery),
                });
            }
        }

        // Sort by relevance (highest first) and limit results
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, this.options.maxResults);
    }

    /**
     * Calculate relevance score for a command against a query
     */
    private calculateRelevance(command: SlashCommand, query: string): number {
        let score = 0;
        const queryWords = query.split(/\s+/).filter(Boolean);

        // Exact name match gets highest score
        if (command.name.toLowerCase() === query) {
            score += 100;
        }

        // Name starts with query
        if (command.name.toLowerCase().startsWith(query)) {
            score += 80;
        }

        // Name contains query
        if (command.name.toLowerCase().includes(query)) {
            score += 60;
        }

        // Check keywords
        const allKeywords = [
            command.name,
            command.description,
            ...(command.keywords || []),
        ].map(k => k.toLowerCase());

        for (const keyword of allKeywords) {
            for (const queryWord of queryWords) {
                if (keyword === queryWord) {
                    score += 40;
                } else if (keyword.startsWith(queryWord)) {
                    score += 30;
                } else if (keyword.includes(queryWord)) {
                    score += 20;
                }
            }
        }

        // Boost score for shorter commands (more specific)
        if (score > 0 && command.name.length <= 10) {
            score += 10;
        }

        return score;
    }

    /**
     * Get keywords that matched the query
     */
    private getMatchedKeywords(command: SlashCommand, query: string): string[] {
        const matched: string[] = [];
        const queryWords = query.split(/\s+/).filter(Boolean);
        const allKeywords = [
            command.name,
            command.description,
            ...(command.keywords || []),
        ];

        for (const keyword of allKeywords) {
            for (const queryWord of queryWords) {
                if (keyword.toLowerCase().includes(queryWord)) {
                    matched.push(keyword);
                    break;
                }
            }
        }

        return [...new Set(matched)]; // Remove duplicates
    }

    /**
     * Add event listener
     */
    addEventListener(listener: SlashCommandRegistryEventListener): void {
        this.listeners.add(listener);
    }

    /**
     * Remove event listener
     */
    removeEventListener(listener: SlashCommandRegistryEventListener): void {
        this.listeners.delete(listener);
    }

    /**
     * Emit event to all listeners
     */
    private emit(event: SlashCommandRegistryEvent): void {
        this.listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in slash command registry listener:', error);
            }
        });
    }

    /**
     * Clear all commands
     */
    clear(): void {
        const commandIds = Array.from(this.commands.keys());
        this.commands.clear();
        commandIds.forEach((id) => {
            this.emit({ type: 'command-unregistered', commandId: id });
        });
    }

    /**
     * Get registry statistics
     */
    getStats(): {
        totalCommands: number;
        categories: Record<string, number>;
        commandsWithParameters: number;
    } {
        const commands = this.getAllCommands();
        const categories: Record<string, number> = {};
        let commandsWithParameters = 0;

        commands.forEach((command) => {
            const category = command.category || 'uncategorized';
            categories[category] = (categories[category] || 0) + 1;
            
            if (command.parameters && command.parameters.length > 0) {
                commandsWithParameters++;
            }
        });

        return {
            totalCommands: commands.length,
            categories,
            commandsWithParameters,
        };
    }
}

// Global registry instance
export const globalSlashCommandRegistry = new SlashCommandRegistry();
