import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API! });

interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
}

interface ChatRequest {
    message: string;
    conversationHistory?: ChatMessage[];
    context?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { message, conversationHistory = [] } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required and must be a string' },
                { status: 400 },
            );
        }

        // Convert conversation history to Gemini format
        const history = conversationHistory.slice(-10).map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        // Get the Gemini model
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
        });

        // Start chat with history
        const chat = model.startChat({
            history,
        });

        // Send message and get response
        const result = await chat.sendMessage(message);
        const response = result.response;
        const reply = response.text();

        return NextResponse.json({
            reply,
            timestamp: new Date().toISOString(),
            model: 'gemini-2.0-flash-exp',
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'gemini-chat',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        model: 'gemini-2.0-flash-exp',
    });
}
