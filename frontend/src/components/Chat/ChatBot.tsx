import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, X, Minimize2, Maximize2, Trash2, RefreshCw, Sparkles, Bot } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../lib/utils'

interface ChatMessage {
  id:              string
  message_type:    'user' | 'assistant'
  message_content: string
  created_at:      string
  metadata?:       any
}

interface ChatResponse {
  response:         string
  session_id:       string
  context_used:     boolean
  context_count:    number
  relevant_context: any[]
}

const SUGGESTIONS = [
  'How much did I spend this month?',
  'Who owes me money?',
  'Show my recent digital expenses',
  'What are my top spending categories?',
]

export const ChatBot: React.FC = () => {
  const { user }                    = useAuth()
  const { showSuccess, showError }  = useToast()
  const [isOpen, setIsOpen]         = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages]     = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [sessionId, setSessionId]   = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (isOpen && !isMinimized) inputRef.current?.focus() }, [isOpen, isMinimized])

  const sendMessage = async (text?: string) => {
    const msg = (text || inputMessage).trim()
    if (!msg || isLoading || !user) return

    setInputMessage('')
    setIsLoading(true)

    const tempId = `temp_${Date.now()}`
    setMessages((prev) => [...prev, {
      id: tempId, message_type: 'user', message_content: msg, created_at: new Date().toISOString(),
    }])

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body:    JSON.stringify({ message: msg, session_id: sessionId || undefined }),
      })
      if (!res.ok) throw new Error('Failed')

      const data: ChatResponse = await res.json()
      if (!sessionId) setSessionId(data.session_id)

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: `a_${Date.now()}`, message_type: 'assistant', message_content: data.response,
          created_at: new Date().toISOString(),
          metadata: { context_used: data.context_used, context_count: data.context_count },
        },
      ])
    } catch {
      showError('Failed to send message. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = async () => {
    if (!sessionId) return
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/history/${sessionId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setMessages([]); setSessionId(''); showSuccess('Chat cleared')
    } catch { showError('Failed to clear chat') }
  }

  const indexData = async () => {
    if (!user) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/index-data`, {
        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (res.ok) showSuccess('Data indexing started.')
    } catch { showError('Failed to start indexing') }
  }

  useEffect(() => {
    if (!isOpen || !sessionId) return
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/history/${sessionId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then((r) => r.ok ? r.json() : null).then((d) => { if (d) setMessages(d.messages || []) }).catch(() => {})
  }, [isOpen, sessionId])

  /* ── FAB ─────────────────────────────────────────────────────────────── */
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-50 lg:bottom-6',
          'flex h-13 w-13 items-center justify-center rounded-2xl',
          'bg-brand-600 text-white shadow-lg shadow-brand-600/30',
          'transition hover:bg-brand-700 hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        )}
        aria-label="Open AI assistant"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    )
  }

  /* ── Chat window ─────────────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-50 lg:bottom-6',
        'flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl',
        'dark:border-gray-700 dark:bg-gray-900',
        'transition-all duration-300',
        isMinimized ? 'h-14 w-72' : 'h-[560px] w-[360px] max-h-[80vh]',
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 rounded-t-2xl border-b border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none">AI Assistant</p>
            {!isMinimized && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Powered by Tracksy.AI</p>}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={indexData}  className="btn-ghost h-7 w-7 p-0" title="Sync data"><RefreshCw className="h-3.5 w-3.5" /></button>
          <button onClick={clearChat}  className="btn-ghost h-7 w-7 p-0" title="Clear chat"><Trash2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => setIsMinimized((v) => !v)} className="btn-ghost h-7 w-7 p-0">
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="btn-ghost h-7 w-7 p-0"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40 mb-3">
                  <Bot className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Hi! I'm your expense assistant.</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">Ask me anything about your finances.</p>
                <div className="w-full space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-600 transition hover:bg-gray-100 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <div key={m.id} className={cn('flex', m.message_type === 'user' ? 'justify-end' : 'justify-start')}>
                    {m.message_type === 'assistant' && (
                      <span className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/40">
                        <Sparkles className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                      </span>
                    )}
                    <div
                      className={cn(
                        'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm',
                        m.message_type === 'user'
                          ? 'rounded-tr-sm bg-brand-600 text-white'
                          : 'rounded-tl-sm bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.message_content}</p>
                      {m.metadata?.context_used && (
                        <p className={cn('mt-1 text-[10px]', m.message_type === 'user' ? 'text-brand-200' : 'text-gray-400')}>
                          Used {m.metadata.context_count} data points
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <span className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/40">
                      <Sparkles className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                    </span>
                    <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-gray-800">
                      <div className="flex gap-1">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce dark:bg-gray-500"
                            style={{ animationDelay: `${delay}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-gray-100 p-3 dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Ask about your expenses…"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
