/**
 * Chat API service — talks to the FastAPI backend.
 * All requests include the Supabase JWT for auth.
 */
import { supabase } from './supabaseClient'

const BASE = () =>
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1'

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  return headers
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE()}${path}`, { ...init, headers: { ...headers, ...(init.headers as any) } })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

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
    const data = await request<{ conversations: Conversation[] }>('/chat/conversations')
    return data.conversations
  },

  async createConversation(): Promise<Conversation> {
    return request<Conversation>('/chat/conversations', { method: 'POST' })
  },

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const data = await request<{ messages: Message[] }>(
      `/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
    )
    return data.messages
  },

  async sendMessage(message: string, conversationId?: string): Promise<{
    conversation_id: string
    response: string
    message_id?: string
    is_new_conversation: boolean
  }> {
    return request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    })
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await request(`/chat/conversations/${conversationId}`, { method: 'DELETE' })
  },
}
