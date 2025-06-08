import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    SlashCommandRegistry,
    SlashCommand,
    SlashCommandProvider,
    SlashCommandInput,
    useDefaultSlashCommands,
    useSlashCommandContext,
} from '@/components/ui/slash-commands';

// Mock commands for testing
const mockCommands: SlashCommand[] = [
    {
        id: 'test-bold',
        name: 'Bold',
        description: 'Make text bold',
        category: 'formatting',
        keywords: ['strong', 'emphasis'],
        execute: ({ insertText }) => {
            insertText('**bold**');
        },
    },
    {
        id: 'test-heading',
        name: 'Heading 1',
        description: 'Large heading',
        category: 'formatting',
        keywords: ['h1', 'title'],
        execute: ({ insertText }) => {
            insertText('# ');
        },
    },
    {
        id: 'test-date',
        name: 'Current Date',
        description: 'Insert today\'s date',
        category: 'utility',
        execute: ({ insertText }) => {
            insertText('2024-01-01');
        },
    },
];

// Test component that uses slash commands
function TestComponent() {
    useDefaultSlashCommands();
    const [value, setValue] = React.useState('');
    
    return (
        <SlashCommandInput
            data-testid="slash-input"
            value={value}
            onChange={setValue}
            placeholder="Type / for commands"
        />
    );
}

describe('SlashCommandRegistry', () => {
    let registry: SlashCommandRegistry;

    beforeEach(() => {
        registry = new SlashCommandRegistry();
    });

    it('should warn when registering a duplicate command ID', () => {
        const command: SlashCommand = {
            id: 'duplicate',
            name: 'Duplicate',
            description: 'A duplicate command',
            execute: jest.fn(),
        };

        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        registry.register(command);
        registry.register(command); // Attempt to register the same command again

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Duplicate command ID'),
            expect.stringContaining('duplicate')
        );

        warnSpy.mockRestore();
    });
    beforeEach(() => {
        registry = new SlashCommandRegistry();
    });

    test('should register and retrieve commands', () => {
        const command = mockCommands[0];
        registry.register(command);
        
        expect(registry.getCommand(command.id)).toBe(command);
        expect(registry.getAllCommands()).toContain(command);
    });

    test('should unregister commands', () => {
        const command = mockCommands[0];
        registry.register(command);
        
        expect(registry.unregister(command.id)).toBe(true);
        expect(registry.getCommand(command.id)).toBeUndefined();
        expect(registry.unregister(command.id)).toBe(false); // Already removed
    });

    test('should search commands by name', () => {
        registry.registerMany(mockCommands);

    });

    test('should filter commands by isAvailable callback in search', () => {
        const availableCommand: SlashCommand = {
            id: 'available',
            name: 'Available Command',
            description: 'This command is available',
            execute: jest.fn(),
            isAvailable: jest.fn(() => true),
        };
        const unavailableCommand: SlashCommand = {
            id: 'unavailable',
            name: 'Unavailable Command',
            description: 'This command is unavailable',
            execute: jest.fn(),
            isAvailable: jest.fn(() => false),
        };
        registry.register(availableCommand);
        registry.register(unavailableCommand);

        const context = {}; // Provide any context needed for isAvailable
        const results = registry.search('Command', context);

        expect(results.some(cmd => cmd.id === 'available')).toBe(true);
        expect(results.some(cmd => cmd.id === 'unavailable')).toBe(false);
        expect(availableCommand.isAvailable).toHaveBeenCalledWith(context);
        expect(unavailableCommand.isAvailable).toHaveBeenCalledWith(context);
        const results = registry.search('bold');
        expect(results).toHaveLength(1);
        expect(results[0].command.id).toBe('test-bold');
        expect(results[0].relevance).toBeGreaterThan(0);
    });

    test('should search commands by keywords', () => {
        registry.registerMany(mockCommands);
        
        const results = registry.search('h1');
        expect(results).toHaveLength(1);
        expect(results[0].command.id).toBe('test-heading');
    });

    test('should return empty results for short queries', () => {
        const registryWithMinLength = new SlashCommandRegistry({ minQueryLength: 2 });
        registryWithMinLength.registerMany(mockCommands);
        
        const results = registryWithMinLength.search('b');
        expect(results).toHaveLength(0);
    });

    test('should limit search results', () => {
        const registryWithLimit = new SlashCommandRegistry({ maxResults: 1 });
        registryWithLimit.registerMany(mockCommands);
        
        const results = registryWithLimit.search('test');
        expect(results.length).toBeLessThanOrEqual(1);
    });

    test('should calculate relevance scores correctly', () => {
        registry.registerMany(mockCommands);
        
        const results = registry.search('bold');
        const exactMatch = results.find(r => r.command.name.toLowerCase() === 'bold');
        const partialMatch = results.find(r => r.command.name.toLowerCase().includes('bold'));
        
        if (exactMatch && partialMatch && exactMatch !== partialMatch) {
            expect(exactMatch.relevance).toBeGreaterThan(partialMatch.relevance);
        }
    });

    test('should provide registry statistics', () => {
        registry.registerMany(mockCommands);

    });

    test('getStats() returns zero and empty categories when registry is empty', () => {
        const emptyRegistry = new SlashCommandRegistry();
        const stats = emptyRegistry.getStats();
        expect(stats.totalCommands).toBe(0);
        expect(stats.categories).toEqual({});
    });

        const stats = registry.getStats();
        expect(stats.totalCommands).toBe(mockCommands.length);
        expect(stats.categories.formatting).toBe(2);
        expect(stats.categories.utility).toBe(1);
    });
});

describe('SlashCommandInput', () => {
    const user = userEvent.setup();

    function renderWithProvider(component: React.ReactElement) {
        return render(
            <SlashCommandProvider>
                {component}
            </SlashCommandProvider>
        );
    }

    test('should render input field', () => {
        renderWithProvider(<TestComponent />);
        
        const input = screen.getByTestId('slash-input');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('placeholder', 'Type / for commands');
    });

    test('should show autocomplete when typing slash', async () => {
        renderWithProvider(<TestComponent />);
        
        const input = screen.getByTestId('slash-input');
        await user.type(input, '/');
        
        // Wait for autocomplete to appear
        await waitFor(() => {
            expect(screen.queryByRole('listbox')).toBeInTheDocument();
        });
    });

    test('should filter commands based on query', async () => {
        renderWithProvider(<TestComponent />);
        
        const input = screen.getByTestId('slash-input');
        await user.type(input, '/bold');
        
        await waitFor(() => {
            expect(screen.getByText('Bold')).toBeInTheDocument();
        });
    });

    test('should navigate with arrow keys', async () => {
        renderWithProvider(<TestComponent />);
        
        const input = screen.getByTestId('slash-input');
        await user.type(input, '/');
        
        await waitFor(() => {
            expect(screen.queryByRole('listbox')).toBeInTheDocument();
        });
        
        // Navigate down
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        
        // Check if selection changed (implementation specific)
        const selectedItem = screen.querySelector('[aria-selected="true"]');
        expect(selectedItem).toBeInTheDocument();
    });

    test('should close autocomplete on escape', async () => {
        renderWithProvider(<TestComponent />);
        
        const input = screen.getByTestId('slash-input');
        await user.type(input, '/');
        
        await waitFor(() => {
            expect(screen.queryByRole('listbox')).toBeInTheDocument();
        });
        
        fireEvent.keyDown(input, { key: 'Escape' });
        
        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
    });

    test('should execute command on enter', async () => {
        renderWithProvider(<TestComponent />);
        
        const input = screen.getByTestId('slash-input');
        await user.type(input, '/bold');
        
        await waitFor(() => {
            expect(screen.getByText('Bold')).toBeInTheDocument();
        });
        
        fireEvent.keyDown(input, { key: 'Enter' });
        
        // Check if command was executed (text should be replaced)
        await waitFor(() => {
            expect(input).toHaveValue('**bold**');
        });
    });

    test('should handle controlled value changes', async () => {
        const TestControlledComponent = () => {
            const [value, setValue] = React.useState('initial text');
            
            return (
                <SlashCommandInput
                    data-testid="controlled-input"
                    value={value}
                    onChange={setValue}
                />
            );
        };
        
        renderWithProvider(<TestControlledComponent />);
        
        const input = screen.getByTestId('controlled-input');
        expect(input).toHaveValue('initial text');
        
        await user.clear(input);
        await user.type(input, 'new text');
        
        expect(input).toHaveValue('new text');
    });
});

describe('SlashCommandProvider', () => {
    test('should provide context to children', () => {
        let contextValue: unknown;
        
        const TestChild = () => {
            const context = useSlashCommandContext();
            contextValue = context;
            return <div>Test</div>;
        };
        
        render(
            <SlashCommandProvider>
                <TestChild />
            </SlashCommandProvider>
        );
        
        expect(contextValue).toBeDefined();
        expect(contextValue.registry).toBeInstanceOf(SlashCommandRegistry);
        expect(typeof contextValue.registerCommand).toBe('function');
        expect(typeof contextValue.searchCommands).toBe('function');
    });

    test('should throw error when used outside provider', () => {
        const TestChild = () => {
            useSlashCommandContext(); // This should throw
            return <div>Test</div>;
        };
        
        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
            render(<TestChild />);
        }).toThrow('useSlashCommandContext must be used within a SlashCommandProvider');
        
        consoleSpy.mockRestore();
    });
});
