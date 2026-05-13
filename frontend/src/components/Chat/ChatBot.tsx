import React, {
  useState, useEffect, useRef, useCallback,
} from 'react'
import {
  Sparkles, X, Plus, Trash2, ChevronLeft,
  Send, MessageSquare, Menu,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { chatService, Conversation, Message } from '../../services/chatService'
import { cn } from '../../lib/utils'
import { format, isToday, isYesterday } from 'date-fns'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d))     return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

const SUGGESTIONS = [
  'How much did I spend this month?',
  'Who owes me money?',
  'Show my recent expenses',
  'What are my top spending categories?',
]

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingDots: React.FC = () => (
  <div className="flex items-end gap-1 px-1 py-0.5">
    {[0, 0.2, 0.4].map((d, i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
        style={{ animationDelay: `${d}s` }}
      />
    ))}
  </div>
)

// ─── Message bubble ───────────────────────────────────────────────────────────

const Bubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex items-end gap-2 mb-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isUser && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 mb-0.5">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </span>
      )}

      <div className={cn('flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[75vw] sm:max-w-xs lg:max-w-sm rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-br-sm bg-brand-600 text-white'
              : 'rounded-bl-sm bg-white text-gray-900 shadow-card dark:bg-gray-800 dark:text-gray-100',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 px-1">
          {formatTime(msg.created_at)}
        </span>
      </div>
    </div>
  )
}

// ─── Main ChatBot ─────────────────────────────────────────────────────────────

export const ChatBot: React.FC = () => {
  const { user } = useAuth()

  // UI state
  const [isOpen,       setIsOpen]       = useState(false)
  const [showSidebar,  setShowSidebar]  = useState(false)

  // Data state
  const [conversations,    setConversations]    = useState<Conversation[]>([])
  const [activeConvId,     setActiveConvId]     = useState<string | null>(null)
  const [messages,         setMessages]         = useState<Message[]>([])
  const [input,            setInput]            = useState('')
  const [isLoading,        setIsLoading]        = useState(false)
  const [isFetchingMsgs,   setIsFetchingMsgs]   = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen, activeConvId])

  // Load conversations when chat opens
  useEffect(() => {
    if (!isOpen || !user) return
    chatService.getConversations()
      .then(setConversations)
      .catch(() => {})
  }, [isOpen, user])

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return }
    setIsFetchingMsgs(true)
    chatService.getMessages(activeConvId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setIsFetchingMsgs(false))
  }, [activeConvId])

  const selectConversation = useCallback((id: string) => {
    setActiveConvId(id)
    setShowSidebar(false)
    setError(null)
  }, [])

  const startNewChat = useCallback(() => {
    setActiveConvId(null)
    setMessages([])
    setShowSidebar(false)
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await chatService.deleteConversation(id).catch(() => {})
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) startNewChat()
  }, [activeConvId, startNewChat])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading || !user) return

    setInput('')
    setError(null)
    setIsLoading(true)

    // Optimistic user bubble
    const tempId = `temp_${Date.now()}`
    const tempMsg: Message = {
      id: tempId, role: 'user', content: msg,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await chatService.sendMessage(msg, activeConvId ?? undefined)

      // Update conversation list
      if (res.is_new_conversation) {
        const convs = await chatService.getConversations()
        setConversations(convs)
        setActiveConvId(res.conversation_id)
      }

      // Replace temp message + add assistant reply
      const assistantMsg: Message = {
        id:         res.message_id ?? `a_${Date.now()}`,
        role:       'assistant',
        content:    res.response,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { ...tempMsg, id: `u_${Date.now()}` },
        assistantMsg,
      ])
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError('Failed to send message. Is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, user, activeConvId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── FAB ────────────────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-50 lg:bottom-6',
          'flex h-14 w-14 items-center justify-center rounded-full',
          'bg-brand-600 text-white shadow-xl shadow-brand-600/40',
          'transition-all hover:bg-brand-700 hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        )}
        aria-label="Open AI chat"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    )
  }

  // ── Chat window ────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        // Mobile: full screen overlay
        'fixed inset-0 z-50',
        // Desktop: floating window
        'lg:inset-auto lg:bottom-6 lg:right-4',
        'lg:w-[400px] lg:h-[620px] lg:max-h-[85vh]',
        'flex flex-col overflow-hidden',
        'rounded-none lg:rounded-2xl',
        'border-0 lg:border lg:border-gray-200 lg:dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-950',
        'shadow-2xl',
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 bg-brand-600 px-4 py-3 text-white">
        <button
          onClick={() => setShowSidebar(v => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition lg:hidden"
          aria-label="Conversations"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">Tracksy AI</p>
          <p className="text-xs text-brand-200 mt-0.5">
            {activeConvId
              ? conversations.find(c => c.id === activeConvId)?.title ?? 'Chat'
              : 'New conversation'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={startNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 z-10 w-72 flex flex-col',
            'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
            'transition-transform duration-200',
            showSidebar ? 'translate-x-0' : '-translate-x-full',
            // Always visible on desktop
            'lg:relative lg:translate-x-0 lg:w-48 lg:shrink-0',
          )}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Chats
            </span>
            <button
              onClick={startNewChat}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 transition"
              title="New chat"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-xs text-gray-400 dark:text-gray-600 text-center">
                No conversations yet
              </p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    'group w-full flex items-center gap-2 px-3 py-2.5 text-left transition',
                    activeConvId === conv.id
                      ? 'bg-brand-50 dark:bg-brand-950/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                  )}
                >
                  <MessageSquare className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    activeConvId === conv.id
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-400',
                  )} />
                  <span className={cn(
                    'flex-1 truncate text-xs',
                    activeConvId === conv.id
                      ? 'font-semibold text-brand-700 dark:text-brand-300'
                      : 'text-gray-700 dark:text-gray-300',
                  )}>
                    {conv.title}
                  </span>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-red-500 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sidebar backdrop (mobile) */}
        {showSidebar && (
          <div
            className="absolute inset-0 z-[9] bg-black/30 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Messages area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
            {isFetchingMsgs ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950/40">
                  <Sparkles className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Hi {user?.full_name?.split(' ')[0] ?? 'there'}! 👋
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Ask me anything about your finances.
                  </p>
                </div>
                <div className="w-full space-y-2 mt-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
                {isLoading && (
                  <div className="flex items-end gap-2 mb-1">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 mb-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </span>
                    <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 shadow-card dark:bg-gray-800">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mb-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Input bar */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  // Auto-grow
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message Tracksy AI…"
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500 max-h-[120px] leading-relaxed"
                style={{ height: '24px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition',
                  input.trim() && !isLoading
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700',
                )}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-600">
              Powered by Gemini · Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
