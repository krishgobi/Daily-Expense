import React, {
  useState, useEffect, useRef, useCallback,
} from 'react'
import {
  Sparkles, X, Plus, Trash2, Send, MessageSquare,
  ChevronLeft, Bot, History, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { chatService, Conversation, Message } from '../../services/chatService'
import { supabase } from '../../services/supabaseClient'
import { cn } from '../../lib/utils'
import { format, isToday, isYesterday } from 'date-fns'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

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
  <div className="flex items-center gap-1.5 py-1 px-1">
    {[0, 0.18, 0.36].map((d, i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-brand-500/70 dark:bg-brand-400 animate-bounce"
        style={{ animationDelay: `${d}s` }}
      />
    ))}
  </div>
)

// ─── Message bubble ───────────────────────────────────────────────────────────

const Bubble: React.FC<{ msg: Message }> = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex items-end gap-2 mb-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow mb-0.5">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      )}
      <div className={cn('flex flex-col gap-0.5 max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm',
            isUser
              ? 'rounded-br-none bg-gradient-to-br from-brand-500 to-violet-600 text-white'
              : 'rounded-bl-none bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 border border-gray-100/80 dark:border-gray-700',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isUser ? 'justify-end' : 'justify-end',
          )}>
            <span className={cn(
              'text-[10px] leading-none',
              isUser ? 'text-white/60' : 'text-gray-400',
            )}>
              {formatTime(msg.created_at)}
            </span>
            {isUser && <span className="text-[10px] leading-none text-white/70">✓✓</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Date separator ───────────────────────────────────────────────────────────

const DateSep: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-gray-200/70 dark:bg-gray-700/50" />
    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-50/80 dark:bg-gray-950/80 px-2 py-0.5 rounded-full">
      {label}
    </span>
    <div className="flex-1 h-px bg-gray-200/70 dark:bg-gray-700/50" />
  </div>
)

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
  title: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteModal: React.FC<DeleteModalProps> = ({ title, onConfirm, onCancel }) => (
  <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/40 backdrop-blur-[2px] rounded-3xl">
    <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl px-5 py-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete conversation?</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-[240px]">
            "<span className="font-medium">{title}</span>" will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 active:scale-95 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
)

// ─── Main ChatBot ─────────────────────────────────────────────────────────────

export const ChatBot: React.FC = () => {
  const { user } = useAuth()

  const [isOpen,         setIsOpen]         = useState(false)
  const [showHistory,    setShowHistory]    = useState(false)
  const [conversations,  setConversations]  = useState<Conversation[]>([])
  const [activeConvId,   setActiveConvId]   = useState<string | null>(null)
  const [messages,       setMessages]       = useState<Message[]>([])
  const [input,          setInput]          = useState('')
  const [isLoading,      setIsLoading]      = useState(false)
  const [isFetchingMsgs, setIsFetchingMsgs] = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [deleteConfirm,  setDeleteConfirm]  = useState<{ id: string; title: string } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [isOpen, activeConvId])

  useEffect(() => {
    if (!isOpen || !user) return
    chatService.getConversations().then(setConversations).catch(() => {})
  }, [isOpen, user])

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
    setShowHistory(false)
    setError(null)
  }, [])

  const startNewChat = useCallback(() => {
    setActiveConvId(null)
    setMessages([])
    setShowHistory(false)
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const requestDelete = useCallback((id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm({ id, title })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return
    const { id } = deleteConfirm
    setDeleteConfirm(null)
    await chatService.deleteConversation(id).catch(() => {})
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) startNewChat()
  }, [deleteConfirm, activeConvId, startNewChat])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading || !user) return

    setInput('')
    setError(null)
    setIsLoading(true)
    if (inputRef.current) inputRef.current.style.height = '24px'

    // Optimistically show user message
    const userMsgId = `u_${Date.now()}`
    const userMsg: Message = { id: userMsgId, role: 'user', content: msg, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])

    // AI bubble id — stable across token updates
    const aiMsgId = `a_${Date.now()}`

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch(`${API_BASE}/chat/stream`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: msg, conversation_id: activeConvId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   aiText  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''   // keep incomplete line for next chunk

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(trimmed.slice(6))

            if (payload.type === 'start') {
              if (payload.is_new) {
                setActiveConvId(payload.conversation_id)
                // Refresh sidebar list in background
                chatService.getConversations()
                  .then(setConversations)
                  .catch(() => {})
              }
            } else if (payload.type === 'token') {
              aiText += payload.content
              const snapshot = aiText
              setMessages(prev => {
                const exists = prev.some(m => m.id === aiMsgId)
                const aiMsg: Message = {
                  id:         aiMsgId,
                  role:       'assistant',
                  content:    snapshot,
                  created_at: new Date().toISOString(),
                }
                return exists
                  ? prev.map(m => m.id === aiMsgId ? aiMsg : m)
                  : [...prev, aiMsg]
              })
            }
          } catch { /* skip malformed line */ }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== aiMsgId))
      setError(err?.message || 'Could not reach the AI. Make sure the backend is running.')
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
          'bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600',
          'text-white shadow-xl shadow-brand-600/40',
          'transition-all duration-200 hover:scale-110 active:scale-95',
        )}
        aria-label="Open AI chat"
      >
        <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" />
        <span className="absolute h-14 w-14 rounded-full bg-brand-400/30 animate-ping" />
      </button>
    )
  }

  // ── Chat window ────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'lg:inset-auto lg:bottom-6 lg:right-4',
        'lg:w-[420px] lg:h-[640px] lg:max-h-[90vh]',
        'flex flex-col overflow-hidden',
        'rounded-none lg:rounded-3xl',
        'border-0 lg:border lg:border-gray-200 lg:dark:border-gray-700',
        'bg-white dark:bg-gray-900',
        'shadow-2xl lg:shadow-[0_24px_64px_-8px_rgba(15,23,42,0.28)]',
      )}
    >
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <DeleteModal
          title={deleteConfirm.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative flex shrink-0 items-center gap-3 bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-3 text-white">
        {/* History / Back button */}
        <button
          onClick={() => showHistory ? setShowHistory(false) : setShowHistory(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition shrink-0"
          title={showHistory ? 'Back to chat' : 'Chat history'}
        >
          {showHistory
            ? <ChevronLeft className="h-5 w-5" />
            : <History className="h-4 w-4" />
          }
        </button>

        {/* Avatar */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="h-4 w-4" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white/60" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-tight truncate">Tracksy AI</p>
            <span className="hidden sm:inline rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/90 shrink-0">
              Finance Copilot
            </span>
          </div>
          <p className="text-[11px] text-white/70 truncate">
            {showHistory ? 'Chat History' : activeTitle}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!showHistory && (
            <button
              onClick={startNewChat}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition"
              title="New chat"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── History panel ──────────────────────────────────────────────────── */}
      {showHistory ? (
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No conversations yet</p>
                <button
                  onClick={startNewChat}
                  className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Start chatting
                </button>
              </div>
            ) : (
              conversations.map(conv => (
                /* Using div instead of button to avoid nested button warning */
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectConversation(conv.id)}
                  onKeyDown={e => e.key === 'Enter' && selectConversation(conv.id)}
                  className={cn(
                    'group w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all cursor-pointer select-none',
                    activeConvId === conv.id
                      ? 'bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-950/30 dark:ring-brand-800'
                      : 'hover:bg-white dark:hover:bg-gray-800',
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                    activeConvId === conv.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                  )}>
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'truncate text-sm font-medium',
                      activeConvId === conv.id
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-gray-700 dark:text-gray-300',
                    )}>
                      {conv.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(conv.created_at)}</p>
                  </div>
                  <button
                    onClick={(e) => requestDelete(conv.id, conv.title, e)}
                    className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[10px] text-gray-400">
              Powered by <span className="font-semibold text-brand-600 dark:text-brand-400">Groq AI</span>
            </p>
          </div>
        </div>

      ) : (
        /* ── Chat panel ──────────────────────────────────────────────────── */
        <>
          {/* Messages — WhatsApp-style subtle background */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 bg-[#f0f2f5] dark:bg-gray-950"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239ca3af' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {isFetchingMsgs ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                <p className="text-xs text-gray-400">Loading…</p>
              </div>

            ) : messages.length === 0 ? (
              /* Welcome state */
              <div className="flex flex-col items-center justify-center h-full gap-5 py-4 text-center">
                {/* Logo */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-brand-500/15 blur-2xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-brand-500 to-violet-600 shadow-xl shadow-brand-500/25">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 ring-4 ring-[#f0f2f5] dark:ring-gray-950 text-white text-[10px] font-bold">
                    AI
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Hey {user?.full_name?.split(' ')[0] ?? 'there'} 👋
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed">
                    Your personal finance AI. Ask me anything about your expenses!
                  </p>
                </div>

                {/* Suggestion grid */}
                <div className="w-full grid grid-cols-2 gap-2 max-w-[360px]">
                  {SUGGESTIONS.map(({ icon, text }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className={cn(
                        'flex items-start gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3',
                        'text-left text-xs text-gray-700 font-medium shadow-sm',
                        'transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-md',
                        'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                        'active:scale-[0.97]',
                      )}
                    >
                      <span className="text-base leading-none mt-0.5 shrink-0">{icon}</span>
                      <span className="leading-snug">{text}</span>
                    </button>
                  ))}
                </div>
              </div>

            ) : (
              /* Messages list */
              <div>
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
                      <Bubble msg={msg} />
                    </React.Fragment>
                  )
                })}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex items-end gap-2 mb-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow mb-0.5">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-bl-none bg-white border border-gray-100 px-4 py-2.5 shadow-sm dark:bg-gray-800 dark:border-gray-700">
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
            <div className="mx-3 mb-2 flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-3 py-2 dark:bg-red-950/30 dark:border-red-900/50">
              <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Input bar */}
          <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-3 py-2.5">
            <div className={cn(
              'flex items-end gap-2 rounded-2xl border px-3.5 py-2 transition-all shadow-sm',
              'bg-gray-50 dark:bg-gray-800',
              input
                ? 'border-brand-400 ring-2 ring-brand-500/10 dark:border-brand-500'
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
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150',
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-600',
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-center text-[10px] text-gray-400 dark:text-gray-600">
              ↵ Enter to send · Shift+Enter for new line · Powered by <span className="text-brand-500 font-medium">Groq AI</span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
