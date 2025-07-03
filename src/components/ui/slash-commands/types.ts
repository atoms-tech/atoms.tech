import { LucideIcon } from 'lucide-react';

// Basic editor interface for TipTap compatibility
export interface EditorLike {
    state: {
        selection: {
            from: number;
            to: number;
        };
        doc: {
            textBetween(from: number, to: number): string;
        };
    };
    getText(): string;
    chain(): {
        focus(): {
            insertContent(content: string): { run(): void };
            deleteRange(range: { from: number; to: number }): { insertContent(content: string): { run(): void } };
        };
    };
    view: {
        dom: HTMLElement;
    };
}

/**
 * Context provided to slash commands when executed
 */
export interface SlashCommandContext {
    /** TipTap editor instance (if available) */
    editor?: EditorLike;
    /** Regular input element (if available) */
    input?: HTMLInputElement | HTMLTextAreaElement;
    /** Current cursor position in the text */
    cursorPosition: number;
    /** Currently selected text (if any) */
    selectedText?: string;
    /** Function to insert text at cursor position */
    insertText: (text: string) => void;
    /** Function to replace text in a range */
    replaceText: (start: number, end: number, text: string) => void;
    /** Query string that triggered the command (without the /) */
    query: string;
}

/**
 * Parameter definition for commands that require user input
 */
export interface SlashCommandParameter {
    /** Parameter identifier */
    id: string;
    /** Display name for the parameter */
    name: string;
    /** Parameter description */
    description?: string;
    /** Parameter type */
    type: 'text' | 'number' | 'url' | 'select';
    /** Whether the parameter is required */
    required?: boolean;
    /** Default value */
    defaultValue?: string | number;
    /** Options for select type parameters */
    options?: string[];
    /** Validation function */
    validate?: (value: string | number) => boolean | string;
}

/**
 * Core slash command interface
 */
export interface SlashCommand {
    /** Unique command identifier */
    id: string;
    /** Display name for the command */
    name: string;
    /** Command description shown in autocomplete */
    description: string;
    /** Icon component (Lucide icon) */
    icon?: LucideIcon;
    /** Command category for grouping */
    category?: string;
    /** Keywords for search matching */
    keywords?: string[];
    /** Command execution function */
    execute: (context: SlashCommandContext) => void | Promise<void>;
    /** Parameters required by the command */
    parameters?: SlashCommandParameter[];
    /** Whether command is available in current context */
    isAvailable?: (context: Partial<SlashCommandContext>) => boolean;
}

/**
 * Command search result with relevance scoring
 */
export interface SlashCommandSearchResult {
    command: SlashCommand;
    relevance: number;
    matchedKeywords: string[];
}

/**
 * Autocomplete state management
 */
export interface SlashCommandAutocompleteState {
    /** Whether autocomplete is open */
    isOpen: boolean;
    /** Current search query */
    query: string;
    /** Filtered and sorted commands */
    commands: SlashCommandSearchResult[];
    /** Currently selected command index */
    selectedIndex: number;
    /** Position for dropdown */
    position: { x: number; y: number } | null;
}

/**
 * Hook return type for useSlashCommands
 */
export interface UseSlashCommandsReturn {
    /** Current autocomplete state */
    state: SlashCommandAutocompleteState;
    /** Handle input change events */
    handleInputChange: (value: string, cursorPosition: number) => void;
    /** Handle keyboard events */
    handleKeyDown: (event: React.KeyboardEvent) => boolean;
    /** Execute the currently selected command */
    executeSelectedCommand: () => void;
    /** Close the autocomplete */
    closeAutocomplete: () => void;
    /** Set the selected command index */
    setSelectedIndex: (index: number) => void;
}

/**
 * Registry configuration options
 */
export interface SlashCommandRegistryOptions {
    /** Maximum number of commands to show in autocomplete */
    maxResults?: number;
    /** Minimum query length to trigger search */
    minQueryLength?: number;
    /** Debounce delay for search in milliseconds */
    searchDebounce?: number;
}

/**
 * Command execution result
 */
export interface SlashCommandExecutionResult {
    /** Whether execution was successful */
    success: boolean;
    /** Error message if execution failed */
    error?: string;
    /** Any data returned by the command */
    data?: unknown;
}

/**
 * Event types for command registry
 */
export type SlashCommandRegistryEvent = 
    | { type: 'command-registered'; command: SlashCommand }
    | { type: 'command-unregistered'; commandId: string }
    | { type: 'command-executed'; command: SlashCommand; result: SlashCommandExecutionResult };

/**
 * Event listener for registry events
 */
export type SlashCommandRegistryEventListener = (event: SlashCommandRegistryEvent) => void;
