'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { SlashCommand } from './types';
import { globalSlashCommandRegistry, SlashCommandRegistry } from '@/lib/slash-commands/registry';

interface SlashCommandContextType {
    /** The command registry instance */
    registry: SlashCommandRegistry;
    /** Register a new command */
    registerCommand: (command: SlashCommand) => void;
    /** Register multiple commands */
    registerCommands: (commands: SlashCommand[]) => void;
    /** Unregister a command */
    unregisterCommand: (commandId: string) => void;
    /** Get all registered commands */
    getAllCommands: () => SlashCommand[];
    /** Search commands */
    searchCommands: (query: string, context?: unknown) => ReturnType<SlashCommandRegistry['search']>;
    /** Registry statistics */
    stats: {
        totalCommands: number;
        categories: Record<string, number>;
        commandsWithParameters: number;
    };
}

const SlashCommandContext = createContext<SlashCommandContextType | undefined>(undefined);

interface SlashCommandProviderProps {
    children: React.ReactNode;
    /** Custom registry instance (optional, uses global by default) */
    registry?: SlashCommandRegistry;
}

export function SlashCommandProvider({ 
    children, 
    registry = globalSlashCommandRegistry 
}: SlashCommandProviderProps) {
    const [stats, setStats] = useState(registry.getStats());

    // Update stats when commands change
    useEffect(() => {
        const updateStats = () => {
            setStats(registry.getStats());
        };

        const listener = () => {
            updateStats();
        };

        registry.addEventListener(listener);
        updateStats(); // Initial stats

        return () => {
            registry.removeEventListener(listener);
        };
    }, [registry]);

    const contextValue: SlashCommandContextType = {
        registry,
        registerCommand: (command: SlashCommand) => {
            registry.register(command);
        },
        registerCommands: (commands: SlashCommand[]) => {
            registry.registerMany(commands);
        },
        unregisterCommand: (commandId: string) => {
            registry.unregister(commandId);
        },
        getAllCommands: () => {
            return registry.getAllCommands();
        },
        searchCommands: (query: string, context?: unknown) => {
            return registry.search(query, context);
        },
        stats,
    };

    return (
        <SlashCommandContext.Provider value={contextValue}>
            {children}
        </SlashCommandContext.Provider>
    );
}

/**
 * Hook to access the slash command context
 */
export function useSlashCommandContext(): SlashCommandContextType {
    const context = useContext(SlashCommandContext);
    if (!context) {
        throw new Error(
            'useSlashCommandContext must be used within a SlashCommandProvider'
        );
    }
    return context;
}

/**
 * Hook to register commands with automatic cleanup
 */
export function useSlashCommandRegistration(commands: SlashCommand[]) {
    const { registerCommands, unregisterCommand } = useSlashCommandContext();

    useEffect(() => {
        // Register commands on mount
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
 * Hook to register a single command with automatic cleanup
 */
export function useSlashCommand(command: SlashCommand) {
    useSlashCommandRegistration([command]);
}
