// Core types
export type {
    SlashCommand,
    SlashCommandContext,
    SlashCommandParameter,
    SlashCommandSearchResult,
    SlashCommandAutocompleteState,
    UseSlashCommandsReturn,
    SlashCommandRegistryOptions,
    SlashCommandExecutionResult,
    SlashCommandRegistryEvent,
    SlashCommandRegistryEventListener,
} from './types';

// Components
export { 
    SlashCommandProvider, 
    useSlashCommandContext, 
    useSlashCommandRegistration, 
    useSlashCommand 
} from './SlashCommandProvider';
export { SlashCommandAutocomplete } from './SlashCommandAutocomplete';
export { SlashCommandInput } from './SlashCommandInput';

// Registry
export { SlashCommandRegistry, globalSlashCommandRegistry } from '@/lib/slash-commands/registry';

// Default commands
export {
    defaultSlashCommands,
    textFormattingCommands,
    structureCommands,
    contentCommands,
    utilityCommands,
} from '@/lib/slash-commands/default-commands';

// Hooks
export { useSlashCommands } from '@/hooks/useSlashCommands';
export { useDefaultSlashCommands, useCustomSlashCommands, useSlashCommandStats } from '@/hooks/useSlashCommandRegistry';
