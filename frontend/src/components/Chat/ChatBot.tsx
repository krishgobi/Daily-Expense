import React, {
  useState, useEffect, useRef, useCallback,
} from 'react'
import {
  Sparkles, X, Plus, Trash2,
  Send, MessageSquare, Menu, Bot, Zap,
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
  { icon: '💸', text: 'How much did I spend this month?' },
  { icon: '🤝', text: 'Who owes me money?' },
  { icon: '📊', text: 'Show my top spending categories' },
  { icon: '📅', text: 'What did I spend last week?' },
  { icon: '💰', text: 'How much have I lent in total?' },
  { icon: '🔍', text: 'Find my biggest expense' },
]

// ─── Typing dots ──────────────────────────────────────────────────────────────

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 py-0.5 px-0.5">
    {[0, 0.18, 0.36].map((d, i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
        style={{ animationDelay: `${d}s` }}
      />
    ))}
  </div>
)

// ─── Message bubble ───────────────────────────────────────────────────────────

const Bubble: React.FC<{ msg: Message; isLatest?: boolean }> = ({ msg, isLatest }) => {
  const isUser = msg.role === 'user'

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
        'mb-2 animate-fade-in',
      )}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow-sm mb-0.5">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[78%]', isUser ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 text-white'
              : 'rounded-bl-md bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 dark:text-gray-600 px-1">
          {formatTime(msg.created_at)}
          {isUser && <span className="ml-1 text-brand-400">✓✓</span>}
        </span>
      </div>
    </div>
  )
}

// ─── Date separator ───────────────────────────────────────────────────────────

const DateSep: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-950 px-2">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
  </div>
)

// ─── Conversation item ────────────────────────────────────────────────────────

const ConvItem: React.FC<{
  conv:     Conversation
  active:   boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}> = ({ conv, active, onSelect, onDelete }) => (
  <button
    onClick={onSelect}
    className={cn(
      'group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all',
      active
        ? 'bg-brand-50 dark:bg-brand-950/40 shadow-sm'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800/60',
    )}
  >
    <div className={cn(
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
      active
        ? 'bg-brand-600 text-white'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    )}>
      <MessageSquare className="h-3.5 w-3.5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn(
        'truncate text-xs font-medium leading-tight',
        active ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300',
      )}>
        {conv.title}
      </p>
      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
        {formatTime(conv.created_at)}
      </p>
    </div>
    <button
      onClick={onDelete}
      className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 transition"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  </button>
)

// ─── Main ChatBot ─────────────────────────────────────────────────────────────

export const ChatBot: React.FC = () => {
  const { user } = useAuth()

  const [isOpen,         setIsOpen]         = useState(false)
  const [showSidebar,    setShowSidebar]    = useState(false)
  const [conversations,  setConversations]  = useState<Conversation[]>([])
  const [activeConvId,   setActiveConvId]   = useState<string | null>(null)
  const [messages,       setMessages]       = useState<Message[]>([])
  const [input,          setInput]          = useState('')
  const [isLoading,      setIsLoading]      = useState(false)
  const [isFetchingMsgs, setIsFetchingMsgs] = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)
  const scrollRef      = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [isOpen, activeConvId])

  // Load conversations
  useEffect(() => {
    if (!isOpen || !user) return
    chatService.getConversations().then(setConversations).catch(() => {})
  }, [isOpen, user])

  // Load messages
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

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '24px'
    }

    const tempId = `temp_${Date.now()}`
    const tempMsg: Message = { id: tempId, role: 'user', content: msg, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await chatService.sendMessage(msg, activeConvId ?? undefined)

      if (res.is_new_conversation) {
        const convs = await chatService.getConversations()
        setConversations(convs)
        setActiveConvId(res.conversation_id)
      }

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
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError('Could not reach the AI. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, user, activeConvId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const activeTitle = activeConvId
    ? (conversations.find(c => c.id === activeConvId)?.title ?? 'Chat')
    : 'New Chat'

  // ── FAB ────────────────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-50 lg:bottom-6',
          'group flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-to-br from-brand-500 to-violet-600',
          'text-white shadow-xl shadow-brand-600/40',
          'transition-all duration-200 hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        )}
        aria-label="Open AI chat"
      >
        <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" />
        {/* Pulse ring */}
        <span className="absolute h-14 w-14 rounded-full bg-brand-400/30 animate-ping" />
      </button>
    )
  }

  // ── Chat window ────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col',
        'lg:inset-auto lg:bottom-6 lg:right-4',
        'lg:w-[420px] lg:h-[640px] lg:max-h-[88vh]',
        'overflow-hidden',
        'rounded-none lg:rounded-3xl',
        'border-0 lg:border lg:border-gray-200/80 lg:dark:border-gray-700/80',
        'bg-[#f0f2f5] dark:bg-gray-950',
        'shadow-2xl lg:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)]',
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-3 text-white">
        {/* Hamburger (mobile) */}
        <button
          onClick={() => setShowSidebar(v => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
          <Sparkles className="h-5 w-5" />
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">Tracksy AI</p>
          <p className="text-xs text-white/70 truncate">{activeTitle}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={startNewChat}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition"
            title="New chat"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 z-20 w-72 flex flex-col',
            'bg-white dark:bg-gray-900',
            'border-r border-gray-200 dark:border-gray-800',
            'transition-transform duration-250 ease-spring',
            showSidebar ? 'translate-x-0 shadow-xl' : '-translate-x-full',
            'lg:relative lg:translate-x-0 lg:w-52 lg:shrink-0 lg:shadow-none',
          )}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Chats
            </span>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 transition"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600">No chats yet</p>
                <button
                  onClick={startNewChat}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Start one →
                </button>
              </div>
            ) : (
              conversations.map(conv => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  active={activeConvId === conv.id}
                  onSelect={() => selectConversation(conv.id)}
                  onDelete={(e) => deleteConversation(conv.id, e)}
                />
              ))
            )}
          </div>

          {/* Sidebar footer */}
          <div className="px-3 py-2.5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-50 to-violet-50 dark:from-brand-950/30 dark:to-violet-950/30 px-3 py-2">
              <Zap className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">
                Powered by <span className="font-semibold text-brand-600 dark:text-brand-400">Gemini AI</span>
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar backdrop */}
        {showSidebar && (
          <div
            className="absolute inset-0 z-[19] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* ── Messages ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Chat background pattern */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 bg-dots"
          >
            {isFetchingMsgs ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                <p className="text-xs text-gray-400">Loading messages…</p>
              </div>

            ) : messages.length === 0 ? (
              /* ── Empty / welcome state ── */
              <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-6">
                {/* Animated logo */}
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/30">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-950 text-white text-xs font-bold">
                    AI
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Hey {user?.full_name?.split(' ')[0] ?? 'there'} 👋
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[240px]">
                    I'm your personal finance AI. Ask me anything!
                  </p>
                </div>

                {/* Suggestion chips */}
                <div className="w-full grid grid-cols-1 gap-2">
                  {SUGGESTIONS.map(({ icon, text }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3',
                        'text-left text-sm text-gray-700 font-medium',
                        'transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm',
                        'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                        'active:scale-[0.98]',
                      )}
                    >
                      <span className="text-base">{icon}</span>
                      <span className="flex-1">{text}</span>
                      <span className="text-gray-300 dark:text-gray-600">→</span>
                    </button>
                  ))}
                </div>
              </div>

            ) : (
              /* ── Messages ── */
              <div className="space-y-0.5">
                {messages.map((msg, i) => {
                  const prev = messages[i - 1]
                  const showDate = !prev ||
                    new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString()
                  const label = isToday(new Date(msg.created_at))
                    ? 'Today'
                    : isYesterday(new Date(msg.created_at))
                    ? 'Yesterday'
                    : format(new Date(msg.created_at), 'MMMM d, yyyy')

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && <DateSep label={label} />}
                      <Bubble msg={msg} isLatest={i === messages.length - 1} />
                    </React.Fragment>
                  )
                })}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex items-end gap-2 mb-2 animate-fade-in">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow-sm mb-0.5">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-white border border-gray-100 px-4 py-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 dark:bg-red-950/40 dark:border-red-900/60">
              <span className="text-red-500 text-sm">⚠️</span>
              <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Input bar ──────────────────────────────────────────────────── */}
          <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-3 py-3">
            <div className={cn(
              'flex items-end gap-2 rounded-2xl border px-3.5 py-2.5 transition-all duration-200',
              'bg-gray-50 dark:bg-gray-800',
              input
                ? 'border-brand-400 ring-2 ring-brand-500/15 dark:border-brand-500'
                : 'border-gray-200 dark:border-gray-700',
            )}>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message Tracksy AI…"
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500 max-h-[120px] leading-relaxed"
                style={{ height: '24px' }}
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/30 hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-600',
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-600">
              ↵ Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
