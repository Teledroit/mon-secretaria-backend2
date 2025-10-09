import { supabase } from './supabase';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationContext {
  clientName?: string;
  appointmentType?: string;
  urgencyLevel?: 'low' | 'medium' | 'high';
  transferRequested?: boolean;
  appointmentRequested?: boolean;
}

export interface AIResponse {
  text: string;
  audioUrl?: string;
  nextAction?: 'continue' | 'transfer' | 'hangup' | 'schedule';
  transferNumber?: string;
  appointmentData?: any;
}

export class ConversationManager {
  private callSid: string;
  private userId: string;
  private config: any;

  constructor(callSid: string, userId: string, config: any) {
    this.callSid = callSid;
    this.userId = userId;
    this.config = config;
  }

  async processUserInput(input: string | Blob): Promise<AIResponse> {
    try {
      // Get current conversation state
      const state = await this.getConversationState();

      // Prepare request data
      const requestData: any = {
        callSid: this.callSid,
        userId: this.userId,
        config: this.config,
        conversationHistory: state.history
      };

      if (typeof input === 'string') {
        requestData.text = input;
      } else {
        // Convert audio blob to base64
        const arrayBuffer = await input.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        requestData.audioData = base64Audio;
      }

      // Call AI conversation function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI conversation failed');
      }

      const aiResponse: AIResponse = await response.json();

      // Update conversation state
      await this.updateConversationState(
        { role: 'user', content: typeof input === 'string' ? input : '[Audio input]', timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiResponse.text, timestamp: new Date().toISOString() },
        {}
      );

      return aiResponse;

    } catch (error) {
      console.error('Error processing user input:', error);
      throw error;
    }
  }

  async getConversationState(): Promise<{ history: ConversationMessage[], context: ConversationContext }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'get',
          callSid: this.callSid,
          userId: this.userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get conversation state');
      }

      const result = await response.json();
      return result.state || { history: [], context: {} };

    } catch (error) {
      console.error('Error getting conversation state:', error);
      return { history: [], context: {} };
    }
  }

  async updateConversationState(
    userMessage: ConversationMessage,
    assistantMessage: ConversationMessage,
    context: Partial<ConversationContext>
  ): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update with user message
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'update',
          callSid: this.callSid,
          userId: this.userId,
          message: userMessage,
          context
        })
      });

      // Update with assistant message
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'update',
          callSid: this.callSid,
          userId: this.userId,
          message: assistantMessage,
          context
        })
      });

    } catch (error) {
      console.error('Error updating conversation state:', error);
    }
  }

  async clearConversationState(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conversation-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'clear',
          callSid: this.callSid,
          userId: this.userId
        })
      });

    } catch (error) {
      console.error('Error clearing conversation state:', error);
    }
  }
}