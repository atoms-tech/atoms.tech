'use client';

import React, { useState } from 'react';
import { 
    SlashCommandProvider,
    SlashCommandInput,
    useDefaultSlashCommands,
} from '@/components/ui/slash-commands';

/**
 * Simple demo page for slash commands
 */
export default function SimpleDemoPage() {
    return (
        <SlashCommandProvider>
            <SimpleDemoContent />
        </SlashCommandProvider>
    );
}

function SimpleDemoContent() {
    useDefaultSlashCommands();
    const [inputValue, setInputValue] = useState('');
    const [textareaValue, setTextareaValue] = useState('');
    const [debugInfo, setDebugInfo] = useState('');

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-4xl">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold">Slash Command System Demo</h1>
                <p className="text-lg text-gray-600">
                    A comprehensive slash command system for text editors and input fields.
                    Type &quot;/&quot; to trigger autocomplete with keyboard navigation support.
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">✨ Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">🎯 Smart Detection</h4>
                            <p className="text-sm text-gray-600">
                                Automatically detects &quot;/&quot; at word boundaries with fuzzy search
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">⌨️ Keyboard Navigation</h4>
                            <p className="text-sm text-gray-600">
                                Arrow keys, Enter, Tab, and Escape for full keyboard control
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">🔧 Extensible</h4>
                            <p className="text-sm text-gray-600">
                                Plugin-like architecture for custom commands and categories
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Input Field Demo</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Single Line Input
                            </label>
                            <SlashCommandInput
                                placeholder="Type / to see available commands..."
                                value={inputValue}
                                onChange={(value) => {
                                    setInputValue(value);
                                    setDebugInfo(`Value: "${value}", Contains slash: ${value.includes('/')}`);
                                }}
                                onCommandExecuted={(commandId) => {
                                    console.log('Command executed:', commandId);
                                    setDebugInfo(`Command executed: ${commandId}`);
                                }}
                                className="w-full p-3 border rounded-md"
                            />
                            <div className="mt-2 text-sm text-gray-500">
                                Current value: {inputValue || '(empty)'}
                            </div>
                            {debugInfo && (
                                <div className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    Debug: {debugInfo}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Textarea Demo</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Multi-line Textarea
                            </label>
                            <SlashCommandInput
                                variant="textarea"
                                placeholder="Type / to see available commands..."
                                value={textareaValue}
                                onChange={setTextareaValue}
                                onCommandExecuted={(commandId) => {
                                    console.log('Command executed:', commandId);
                                }}
                                textareaProps={{
                                    rows: 6,
                                    className: "w-full p-3 border rounded-md resize-none",
                                }}
                            />
                            <div className="mt-2 text-sm text-gray-500">
                                Lines: {textareaValue.split('\n').length} | 
                                Characters: {textareaValue.length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Available Commands</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Formatting</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div>/h1, /h2, /h3 - Headings</div>
                                <div>/bold - Bold text</div>
                                <div>/italic - Italic text</div>
                                <div>/code - Inline code</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Structure</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div>/bullet-list - Bullet list</div>
                                <div>/numbered-list - Numbered list</div>
                                <div>/quote - Blockquote</div>
                                <div>/divider - Horizontal rule</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Content & Utility</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div>/link - Insert link</div>
                                <div>/image - Insert image</div>
                                <div>/date - Current date</div>
                                <div>/time - Current time</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">🚀 Quick Start</h2>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">1. Wrap your app with SlashCommandProvider</h4>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<SlashCommandProvider>
  <YourApp />
</SlashCommandProvider>`}
                            </pre>
                        </div>
                        
                        <div>
                            <h4 className="font-medium mb-2">2. Use SlashCommandInput for basic inputs</h4>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<SlashCommandInput
  value={value}
  onChange={setValue}
  placeholder="Type / for commands..."
/>`}
                            </pre>
                        </div>
                        
                        <div>
                            <h4 className="font-medium mb-2">3. Register default commands</h4>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`function MyComponent() {
  useDefaultSlashCommands(); // Registers all default commands
  return <SlashCommandInput ... />;
}`}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
