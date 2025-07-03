import { SlashCommandRegistry, SlashCommand } from '@/lib/slash-commands/registry';

// Mock commands for testing
const mockCommands: SlashCommand[] = [
    {
        id: 'test-bold',
        name: 'Bold',
        description: 'Make text bold',
        category: 'formatting',
        keywords: ['strong', 'emphasis'],
        execute: jest.fn(),
    },
    {
        id: 'test-heading',
        name: 'Heading 1',
        description: 'Large heading',
        category: 'formatting',
        keywords: ['h1', 'title'],
        execute: jest.fn(),
    },
    {
        id: 'test-date',
        name: 'Current Date',
        description: 'Insert today\'s date',
        category: 'utility',
        execute: jest.fn(),
    },
];

describe('SlashCommandRegistry', () => {
    let registry: SlashCommandRegistry;

    beforeEach(() => {
        registry = new SlashCommandRegistry();
    });

    test('should register and retrieve commands', () => {
        const command = mockCommands[0];
        registry.register(command);
        
        expect(registry.getCommand(command.id)).toBe(command);
        expect(registry.getAllCommands()).toContain(command);
    });

    test('should warn when registering a duplicate command ID', () => {
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
            'Command with id "duplicate" is already registered'
        );

        warnSpy.mockRestore();
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

    test('should provide registry statistics', () => {
        registry.registerMany(mockCommands);
        
        const stats = registry.getStats();
        expect(stats.totalCommands).toBe(mockCommands.length);
        expect(stats.categories.formatting).toBe(2);
        expect(stats.categories.utility).toBe(1);
    });

    test('getStats() returns zero and empty categories when registry is empty', () => {
        const emptyRegistry = new SlashCommandRegistry();
        const stats = emptyRegistry.getStats();
        expect(stats.totalCommands).toBe(0);
        expect(stats.categories).toEqual({});
    });

    test('should calculate relevance scores correctly for different match types', () => {
        // Targeted mock commands for each match type
        const targetedCommands = [
            { id: 'bold', name: 'bold', description: 'Make text bold', category: 'formatting', execute: jest.fn() },
            { id: 'bolden', name: 'bolden', description: 'Emphasize text', category: 'formatting', execute: jest.fn() },
            { id: 'embolden', name: 'embolden', description: 'Highlight text', category: 'formatting', execute: jest.fn() },
            { id: 'italic', name: 'italic', description: 'Make text italic', category: 'formatting', execute: jest.fn() },
        ] as SlashCommand[];

        const testRegistry = new SlashCommandRegistry();
        testRegistry.registerMany(targetedCommands);

        // Exact match
        const results = testRegistry.search('bold');
        const exact = results.find(r => r.command.name === 'bold');
        const prefix = results.find(r => r.command.name === 'bolden');
        const substring = results.find(r => r.command.name === 'embolden');

        expect(exact).toBeDefined();
        expect(prefix).toBeDefined();
        expect(substring).toBeDefined();

        // Assert relevance order: exact > prefix > substring
        expect(exact!.relevance).toBeGreaterThan(prefix!.relevance);
        expect(prefix!.relevance).toBeGreaterThan(substring!.relevance);
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

        expect(results.some(cmd => cmd.command.id === 'available')).toBe(true);
        expect(results.some(cmd => cmd.command.id === 'unavailable')).toBe(false);
        expect(availableCommand.isAvailable).toHaveBeenCalledWith(context);
        expect(unavailableCommand.isAvailable).toHaveBeenCalledWith(context);
    });
});
