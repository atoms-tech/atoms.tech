import { useEffect } from 'react';

import { 
    defaultSlashCommands,
    useSlashCommandContext,
    SlashCommand,
} from '@/components/ui/slash-commands';

/**
 * Hook to automatically register default commands
 */
export function useDefaultSlashCommands() {
    const { registerCommands, unregisterCommand } = useSlashCommandContext();

    useEffect(() => {
        // Register default commands
        registerCommands(defaultSlashCommands);

        // Cleanup on unmount
        return () => {
            defaultSlashCommands.forEach((command) => {
                unregisterCommand(command.id);
            });
        };
    }, [registerCommands, unregisterCommand]);
}

/**
 * Hook to register custom commands with automatic cleanup
 */
export function useCustomSlashCommands(commands: SlashCommand[]) {
    const { registerCommands, unregisterCommand } = useSlashCommandContext();

    useEffect(() => {
        // Register custom commands
        registerCommands(commands);

        // Cleanup on unmount
        return () => {
            commands.forEach((command) => {
                unregisterCommand(command.id);
            });
        };
    }, [commands, registerCommands, unregisterCommand]);
}

/**
 * Hook to get registry statistics
 */
export function useSlashCommandStats() {
    const { stats } = useSlashCommandContext();
    return stats;
}
