'use client';

import React, { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    SlashCommandProvider,
    SlashCommandInput,
    useDefaultSlashCommands,
    useSlashCommandStats,
} from '@/components/ui/slash-commands';

/**
 * Demo component showcasing slash command functionality
 */
export function SlashCommandDemo() {
    return (
        <SlashCommandProvider>
            <SlashCommandDemoContent />
        </SlashCommandProvider>
    );
}

function SlashCommandDemoContent() {
    useDefaultSlashCommands(); // Register default commands
    const stats = useSlashCommandStats();
    
    const [inputValue, setInputValue] = useState('');
    const [textareaValue, setTextareaValue] = useState('');

    return (
        <div className="space-y-6 p-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Slash Command System Demo</h2>
                <p className="text-muted-foreground">
                    Type &quot;/&quot; in any input field to trigger the slash command autocomplete.
                    Use arrow keys to navigate and Enter to execute commands.
                </p>
            </div>

            {/* Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Registry Statistics</CardTitle>
                    <CardDescription>
                        Current state of the command registry
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                            Total Commands: {stats.totalCommands}
                        </Badge>
                        <Badge variant="secondary">
                            With Parameters: {stats.commandsWithParameters}
                        </Badge>
                        {Object.entries(stats.categories).map(([category, count]) => (
                            <Badge key={category} variant="outline">
                                {category}: {count}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Demo Inputs */}
            <Tabs defaultValue="input" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="input">Input Field</TabsTrigger>
                    <TabsTrigger value="textarea">Textarea</TabsTrigger>
                </TabsList>
                
                <TabsContent value="input" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Single Line Input</CardTitle>
                            <CardDescription>
                                Try typing &quot;/&quot; followed by a command name like &quot;bold&quot;, &quot;h1&quot;, &quot;date&quot;, etc.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SlashCommandInput
                                placeholder="Type / to see available commands..."
                                value={inputValue}
                                onChange={setInputValue}
                                onCommandExecuted={(commandId) => {
                                    console.log('Command executed:', commandId);
                                }}
                                className="w-full"
                            />
                            <div className="mt-2 text-sm text-muted-foreground">
                                Current value: {inputValue || '(empty)'}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="textarea" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Multi-line Textarea</CardTitle>
                            <CardDescription>
                                Slash commands work in multi-line text areas too. Try different formatting commands.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                    className: "w-full resize-none",
                                }}
                            />
                            <div className="mt-2 text-sm text-muted-foreground">
                                Lines: {textareaValue.split('\n').length} | 
                                Characters: {textareaValue.length}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Available Commands */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Commands</CardTitle>
                    <CardDescription>
                        Here are some commands you can try:
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Formatting</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>/h1, /h2, /h3 - Headings</div>
                                <div>/bold - Bold text</div>
                                <div>/italic - Italic text</div>
                                <div>/code - Inline code</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Structure</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>/bullet-list - Bullet list</div>
                                <div>/numbered-list - Numbered list</div>
                                <div>/quote - Blockquote</div>
                                <div>/divider - Horizontal rule</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Content & Utility</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div>/link - Insert link</div>
                                <div>/image - Insert image</div>
                                <div>/date - Current date</div>
                                <div>/time - Current time</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
