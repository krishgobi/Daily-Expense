/**
 * Chat API service — talks to the FastAPI backend via the shared axios instance
 * so auth (Supabase JWT) is handled identically to all other API calls.
 */
import api from './api'

export interface Conversation {
  id:         string
  title:      string
  created_at: string
}

export interface Message {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  created_at: string
}

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const { data } = await api.get<{ conversations: Conversation[] }>('/chat/conversations')
    return data.conversations
  },

  async createConversation(): Promise<Conversation> {
    const { data } = await api.post<Conversation>('/chat/conversations')
    return data
  },

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const { data } = await api.get<{ messages: Message[] }>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { limit, offset } },
    )
    return data.messages
  },

  async sendMessage(message: string, conversationId?: string): Promise<{
    conversation_id:     string
    response:            string
    message_id?:         string
    is_new_conversation: boolean
  }> {
    const { data } = await api.post('/chat/send', { message, conversation_id: conversationId })
    return data
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/chat/conversations/${conversationId}`)
  },
}
