import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, X, Minimize2, Maximize2, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

interface ChatMessage {
  id: string
  message_type: 'user' | 'assistant'
  message_content: string
  created_at: string
  metadata?: any
}

interface ChatResponse {
  response: string
  session_id: string
  context_used: boolean
  context_count: number
  relevant_context: any[]
}

export const ChatBot: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message immediately for better UX
    const tempUserMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      message_type: 'user',
      message_content: userMessage,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data: ChatResponse = await response.json()
      
      // Update session ID if new session
      if (!sessionId) {
        setSessionId(data.session_id)
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        message_type: 'assistant',
        message_content: data.response,
        created_at: new Date().toISOString(),
        metadata: {
          context_used: data.context_used,
          context_count: data.context_count
        }
      }

      setMessages(prev => [...prev.filter(msg => msg.id !== tempUserMessage.id), assistantMessage])

    } catch (error) {
      console.error('Chat error:', error)
      showError('Failed to send message. Please try again.')
      
      // Remove the temporary message if it failed
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = async () => {
    if (!sessionId) return
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      setMessages([])
      setSessionId('')
      showSuccess('Chat history cleared')
    } catch (error) {
      console.error('Failed to clear chat:', error)
      showError('Failed to clear chat history')
    }
  }

  const indexUserData = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/index-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        showSuccess('Data indexing started. This may take a few minutes.')
      }
    } catch (error) {
      console.error('Failed to index data:', error)
      showError('Failed to start data indexing')
    }
  }

  const loadChatHistory = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/history/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  useEffect(() => {
    if (isOpen && sessionId) {
      loadChatHistory()
    }
  }, [isOpen, sessionId])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 z-50"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transition-all duration-300 ${
      isMinimized ? 'w-64 h-14' : 'w-96 h-[600px] max-h-[80vh]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Expense Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={indexUserData}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Index your data for better responses"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 h-[460px]">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Hello! I'm your expense assistant.</p>
                <p className="text-sm">Ask me anything about your expenses and transactions!</p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>Try asking:</p>
                  <p>"How much did I spend on food this month?"</p>
                  <p>"Who owes me money?"</p>
                  <p>"Show my recent digital expenses"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.message_type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message_content}</p>
                      {message.metadata?.context_used && (
                        <p className={`text-xs mt-1 ${
                          message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          📊 Used {message.metadata.context_count} data points
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your expenses..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
