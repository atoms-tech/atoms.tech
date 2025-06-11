'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Mic, MicOff, Send, Minimize2, Maximize2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAgentStore } from './hooks/useAgentStore';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'voice';
}

interface AgentPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSettingsClick?: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  isOpen,
  onToggle,
  onClose,
  onSettingsClick,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { messages, addMessage, isConnected, connectionStatus, sendToN8n, n8nWebhookUrl } = useAgentStore();

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/chat/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { transcript } = await response.json();
        setMessage(transcript);
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    addMessage(userMessage);
    const currentMessage = message;
    setMessage('');

    try {
      setIsLoading(true);
      
      let reply: string;
      
      // Try N8N first if configured, fallback to local AI chat
      if (n8nWebhookUrl && isConnected) {
        try {
          const n8nResponse = await sendToN8n({
            type: 'chat',
            message: currentMessage,
            conversationHistory: messages.slice(-10),
            timestamp: new Date().toISOString(),
          });
          reply = n8nResponse.reply || n8nResponse.message || 'N8N workflow completed successfully.';
        } catch (n8nError) {
          console.warn('N8N request failed, falling back to local AI:', n8nError);
          // Fallback to local AI
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: currentMessage,
              conversationHistory: messages.slice(-10),
            }),
          });
          const data = await response.json();
          reply = data.reply;
        }
      } else {
        // Use local AI chat
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentMessage,
            conversationHistory: messages.slice(-10),
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          reply = data.reply;
        } else {
          throw new Error('API request failed');
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: reply,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      addMessage(assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-background border-l border-border z-50 transition-all duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          isMinimized ? 'w-80' : 'w-96 md:w-[28rem]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">AI Agent</h2>
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className="text-xs"
            >
              {connectionStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSettingsClick}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Start a conversation with the AI agent</p>
                <p className="text-xs mt-1">Type a message or use voice input</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <Card
                    className={cn(
                      'max-w-[80%] p-3',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                      {msg.type === 'voice' && ' 🎤'}
                    </p>
                  </Card>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted text-muted-foreground p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <p className="text-sm">AI is thinking...</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                {...({ ref: textareaRef } as any)}
                value={message}
                onChange={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-[200px] resize-none pr-12"
                disabled={isLoading}
              />
              <Button
                type="button"
                size="icon"
                variant={isRecording ? 'destructive' : 'ghost'}
                className="absolute right-2 top-2 h-8 w-8"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="h-[44px] px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isRecording
              ? 'Recording... Click microphone to stop'
              : 'Click microphone to start voice input'}
          </p>
        </div>
      </div>
    </>
  );
}; 