'use client';

import React from 'react';

import { SlashCommandDemo } from '@/components/custom/SlashCommandDemo';
import {
    SlashCommandProvider,
    useDefaultSlashCommands,
} from '@/components/ui/slash-commands';
import { TextBlock } from '@/components/custom/BlockCanvas/components/TextBlock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

/**
 * Demo page showcasing the complete slash command system
 */
export default function SlashCommandsDemoPage() {
    return (
        <SlashCommandProvider>
            <SlashCommandsDemoContent />
        </SlashCommandProvider>
    );
}

function SlashCommandsDemoContent() {
    useDefaultSlashCommands();

    // Mock block data for TextBlock demo
    const mockBlock = {
        id: 'demo-block-1',
        content: { text: '<p>Try typing "/" in this editor...</p>' },
        position: 1,
        type: 'text' as const,
        document_id: 'demo-doc',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'demo-user',
        updated_by: 'demo-user',
        deleted_at: null,
        deleted_by: null,
        is_deleted: false,
        org_id: 'demo-org',
        version: 1,
        requirements: [],
        order: 1,
        name: 'Demo Text Block',
    };

    const handleBlockUpdate = (updates: unknown) => {
        console.log('Block updated:', updates);
    };

    const handleBlockDelete = () => {
        console.log('Block deleted');
    };

    const handleBlockSelect = (blockId: string) => {
        console.log('Block selected:', blockId);
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">Slash Command System</h1>
                    <Badge variant="secondary">Demo</Badge>
                </div>
                <p className="text-lg text-muted-foreground max-w-3xl">
                    A comprehensive slash command system for text editors and input fields. 
                    Type &quot;/&quot; to trigger autocomplete with keyboard navigation support.
                </p>
            </div>

            {/* Features Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>✨ Features</CardTitle>
                    <CardDescription>
                        What makes this slash command system powerful
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">🎯 Smart Detection</h4>
                            <p className="text-sm text-muted-foreground">
                                Automatically detects &quot;/&quot; at word boundaries with fuzzy search
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">⌨️ Keyboard Navigation</h4>
                            <p className="text-sm text-muted-foreground">
                                Arrow keys, Enter, Tab, and Escape for full keyboard control
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">🔧 Extensible</h4>
                            <p className="text-sm text-muted-foreground">
                                Plugin-like architecture for custom commands and categories
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">📝 TipTap Integration</h4>
                            <p className="text-sm text-muted-foreground">
                                Native support for rich text editors with command execution
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">🎨 Customizable UI</h4>
                            <p className="text-sm text-muted-foreground">
                                Themed autocomplete dropdown with icons and descriptions
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">⚡ Performance</h4>
                            <p className="text-sm text-muted-foreground">
                                Debounced search, memoized results, and efficient rendering
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* TipTap Editor Demo */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">TipTap Editor Integration</h2>
                    <p className="text-muted-foreground">
                        Rich text editor with slash commands, formatting toolbar, and full keyboard support.
                    </p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Rich Text Block with Slash Commands</CardTitle>
                        <CardDescription>
                            This demonstrates the TextBlock component enhanced with slash command support.
                            Try typing &quot;/&quot; followed by commands like &quot;h1&quot;, &quot;bold&quot;, &quot;bullet-list&quot;, etc.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-4 min-h-[200px]">
                            <TextBlock
                                block={mockBlock}
                                onUpdate={handleBlockUpdate}
                                onDelete={handleBlockDelete}
                                onSelect={handleBlockSelect}
                            />
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                            💡 <strong>Tip:</strong> Select text to see the formatting toolbar, or type &quot;/&quot; for slash commands.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* Basic Input Demo */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold">Input Field Integration</h2>
                    <p className="text-muted-foreground">
                        Standard input fields and textareas enhanced with slash command support.
                    </p>
                </div>
                
                <SlashCommandDemo />
            </div>

            {/* Implementation Guide */}
            <Card>
                <CardHeader>
                    <CardTitle>🚀 Quick Start</CardTitle>
                    <CardDescription>
                        How to integrate slash commands into your components
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">1. Wrap your app with SlashCommandProvider</h4>
                            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<SlashCommandProvider>
  <YourApp />
</SlashCommandProvider>`}
                            </pre>
                        </div>
                        
                        <div>
                            <h4 className="font-medium mb-2">2. Use SlashCommandInput for basic inputs</h4>
                            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<SlashCommandInput
  value={value}
  onChange={setValue}
  placeholder="Type / for commands..."
/>`}
                            </pre>
                        </div>
                        
                        <div>
                            <h4 className="font-medium mb-2">3. Register default commands</h4>
                            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`function MyComponent() {
  useDefaultSlashCommands(); // Registers all default commands
  return <SlashCommandInput ... />;
}`}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
