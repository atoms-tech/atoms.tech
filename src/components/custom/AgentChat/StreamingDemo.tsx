'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConversationMessage } from '@/components/ui/ai-elements';
import { TypingIndicator, TypingIndicatorMessage } from '@/components/ui/typing-indicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Streaming Demo Component
 * 
 * Demonstrates the streaming chat enhancements:
 * 1. Typing indicator (thinking state)
 * 2. Token-by-token streaming
 * 3. Auto-expanding chat bubbles
 */

export const StreamingDemo: React.FC = () => {
    const [stage, setStage] = useState<'idle' | 'thinking' | 'streaming' | 'complete'>('idle');
    const [streamedText, setStreamedText] = useState('');

    const fullText = "This is a demonstration of smooth token-by-token streaming! Watch how the text appears character by character, and the chat bubble expands smoothly. The typing indicator shows when I'm thinking, then switches to a blinking cursor as content streams in. Pretty cool, right? 🚀";

    const startDemo = () => {
        setStage('thinking');
        setStreamedText('');

        // Thinking phase (1 second)
        setTimeout(() => {
            setStage('streaming');
            
            // Stream text character by character
            let currentIndex = 0;
            const streamInterval = setInterval(() => {
                if (currentIndex < fullText.length) {
                    setStreamedText(fullText.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(streamInterval);
                    setStage('complete');
                }
            }, 30); // 30ms per character for smooth streaming
        }, 1000);
    };

    const reset = () => {
        setStage('idle');
        setStreamedText('');
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Streaming Chat Enhancements Demo</CardTitle>
                <CardDescription>
                    See the typing indicator, token-by-token streaming, and auto-expanding bubbles in action
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Controls */}
                <div className="flex gap-2">
                    <Button onClick={startDemo} disabled={stage !== 'idle' && stage !== 'complete'}>
                        {stage === 'idle' ? 'Start Demo' : stage === 'complete' ? 'Restart Demo' : 'Running...'}
                    </Button>
                    {stage !== 'idle' && (
                        <Button variant="outline" onClick={reset}>
                            Reset
                        </Button>
                    )}
                </div>

                {/* Status */}
                <div className="text-sm text-muted-foreground">
                    <strong>Current Stage:</strong>{' '}
                    {stage === 'idle' && 'Ready to start'}
                    {stage === 'thinking' && '🤔 Thinking... (showing typing indicator)'}
                    {stage === 'streaming' && '✍️ Streaming... (token-by-token rendering)'}
                    {stage === 'complete' && '✅ Complete (markdown rendered)'}
                </div>

                {/* Demo Messages */}
                <div className="space-y-4 border rounded-lg p-4 bg-background min-h-[200px]">
                    {/* User Message */}
                    <ConversationMessage role="user">
                        Tell me about the streaming enhancements!
                    </ConversationMessage>

                    {/* Thinking State */}
                    {stage === 'thinking' && (
                        <TypingIndicatorMessage />
                    )}

                    {/* Streaming State */}
                    {stage === 'streaming' && (
                        <ConversationMessage role="assistant" isStreaming={true}>
                            <div className="whitespace-pre-wrap break-words">
                                {streamedText}
                            </div>
                        </ConversationMessage>
                    )}

                    {/* Complete State */}
                    {stage === 'complete' && (
                        <ConversationMessage role="assistant" isStreaming={false}>
                            <div className="animate-in fade-in duration-300">
                                {streamedText}
                            </div>
                        </ConversationMessage>
                    )}
                </div>

                {/* Component Examples */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm">Component Examples:</h3>
                    
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Typing Indicator (Small):</p>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <TypingIndicator size="sm" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Typing Indicator (Medium):</p>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <TypingIndicator size="md" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Typing Indicator (Large):</p>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <TypingIndicator size="lg" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

