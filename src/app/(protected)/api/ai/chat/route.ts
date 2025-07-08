import { NextRequest, NextResponse } from 'next/server';

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
    const { message, conversationHistory = [], context = {} } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Here we can implement different strategies:
    // 1. Direct AI integration (OpenAI, Anthropic, etc.)
    // 2. Route to N8N workflow
    // 3. Use local AI model
    // 4. Fallback responses

    // For now, let's implement a simple response system
    // This will be replaced with actual AI integration
    const reply = await generateResponse(message, conversationHistory, context);

    return NextResponse.json({
      reply,
      timestamp: new Date().toISOString(),
      model: 'atoms-tech-agent',
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateResponse(
  message: string, 
  history: ChatMessage[], 
  _context: Record<string, unknown>
): Promise<string> {
  // This is a placeholder implementation
  // In production, this would integrate with:
  // - OpenAI API
  // - Anthropic Claude
  // - Local AI models
  // - N8N workflows
  // - Custom business logic

  const lowerMessage = message.toLowerCase();

  // Simple pattern matching for demo purposes
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI agent assistant. How can I help you today?";
  }

  if (lowerMessage.includes('help')) {
    return `I can assist you with various tasks:

• Answer questions about your projects
• Help with code and technical issues  
• Provide information and explanations
• Integrate with N8N workflows for automation
• Process voice commands

What would you like help with?`;
  }

  if (lowerMessage.includes('n8n') || lowerMessage.includes('workflow')) {
    return `I can help you with N8N workflow automation! Here's what I can do:

• Connect to your N8N instance
• Send data to your workflows
• Receive responses from automated processes
• Help configure webhook integrations

To get started, please configure your N8N webhook URL in the agent settings.`;
  }

  if (lowerMessage.includes('voice') || lowerMessage.includes('microphone')) {
    return `Voice features are available! You can:

• Click the microphone button to record voice messages
• I'll transcribe your speech to text automatically
• Continue the conversation naturally

The voice recognition works best in quiet environments.`;
  }

  if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
    return `I can help with coding and programming tasks:

• Debug and explain code
• Suggest improvements and best practices
• Help with different programming languages
• Provide examples and documentation

What programming challenge are you working on?`;
  }

  // Contextual responses based on conversation history
  if (history.length > 0) {
    const lastMessage = history[history.length - 1];
    if (lastMessage.role === 'assistant' && lastMessage.content.includes('help')) {
      return "I see you're looking for more specific assistance. Could you tell me more about what you're trying to accomplish?";
    }
  }

  // Default response
  return `I understand you're asking about "${message}". While I'm still learning about your specific needs, I'm here to help! 

Could you provide more details about what you'd like to know or accomplish? I can assist with:
• Technical questions and coding
• Project planning and documentation  
• Workflow automation with N8N
• General information and explanations`;
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'atoms-tech-ai-chat',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
} 