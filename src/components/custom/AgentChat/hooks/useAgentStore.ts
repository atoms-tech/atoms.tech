import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'voice';
}

interface AgentStore {
  // Panel state
  isOpen: boolean;
  isMinimized: boolean;
  
  // Messages
  messages: Message[];
  
  // Connection status
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  
  // N8N Integration (future)
  n8nWebhookUrl?: string;
  n8nApiKey?: string;
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  setIsMinimized: (isMinimized: boolean) => void;
  togglePanel: () => void;
  
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  
  setConnectionStatus: (status: AgentStore['connectionStatus']) => void;
  setN8nConfig: (webhookUrl: string, apiKey: string) => void;
  
  // N8N Integration methods (prepared for future use)
  sendToN8n: (data: any) => Promise<any>;
  initializeConnection: () => Promise<void>;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOpen: false,
      isMinimized: false,
      messages: [],
      isConnected: false,
      connectionStatus: 'disconnected',
      
      // Actions
      setIsOpen: (isOpen: boolean) => set({ isOpen }),
      setIsMinimized: (isMinimized: boolean) => set({ isMinimized }),
      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
      
      addMessage: (message: Message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      
      clearMessages: () => set({ messages: [] }),
      
      setConnectionStatus: (connectionStatus) =>
        set({ 
          connectionStatus,
          isConnected: connectionStatus === 'connected'
        }),
      
      setN8nConfig: (webhookUrl: string, apiKey: string) =>
        set({ n8nWebhookUrl: webhookUrl, n8nApiKey: apiKey }),
      
      // N8N Integration methods (future implementation)
      sendToN8n: async (data: any) => {
        const { n8nWebhookUrl, n8nApiKey } = get();
        
        if (!n8nWebhookUrl) {
          throw new Error('N8N webhook URL not configured');
        }
        
        try {
          set({ connectionStatus: 'connecting' });
          
          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(n8nApiKey && { 'Authorization': `Bearer ${n8nApiKey}` }),
            },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              source: 'atoms-tech-agent',
              ...data,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`N8N request failed: ${response.statusText}`);
          }
          
          set({ connectionStatus: 'connected' });
          return await response.json();
        } catch (error) {
          set({ connectionStatus: 'error' });
          throw error;
        }
      },
      
      initializeConnection: async () => {
        const { n8nWebhookUrl } = get();
        
        if (!n8nWebhookUrl) {
          set({ connectionStatus: 'disconnected' });
          return;
        }
        
        try {
          set({ connectionStatus: 'connecting' });
          
          // Test connection with a ping
          await get().sendToN8n({
            type: 'ping',
            message: 'Connection test from Atoms.tech Agent',
          });
          
          set({ connectionStatus: 'connected' });
        } catch (error) {
          console.error('Failed to initialize N8N connection:', error);
          set({ connectionStatus: 'error' });
        }
      },
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({
        messages: state.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        n8nWebhookUrl: state.n8nWebhookUrl,
        n8nApiKey: state.n8nApiKey,
        isMinimized: state.isMinimized,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.messages) {
          state.messages = state.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
      },
    }
  )
); 