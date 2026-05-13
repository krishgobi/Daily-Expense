import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Toast {
  id:        string
  type:      'success' | 'error' | 'info' | 'warning'
  message:   string
  duration?: number
}

interface ToastItemProps {
  toast:    Toast
  onRemove: (id: string) => void
}

const config = {
  success: {
    icon:  CheckCircle2,
    base:  'border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/80',
    text:  'text-emerald-800 dark:text-emerald-200',
    icon_: 'text-emerald-500',
  },
  error: {
    icon:  AlertCircle,
    base:  'border-red-200 bg-red-50 dark:border-red-800/60 dark:bg-red-950/80',
    text:  'text-red-800 dark:text-red-200',
    icon_: 'text-red-500',
  },
  warning: {
    icon:  AlertTriangle,
    base:  'border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/80',
    text:  'text-amber-800 dark:text-amber-200',
    icon_: 'text-amber-500',
  },
  info: {
    icon:  Info,
    base:  'border-blue-200 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-950/80',
    text:  'text-blue-800 dark:text-blue-200',
    icon_: 'text-blue-500',
  },
}

export const Toast: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false)
  const { icon: Icon, base, text, icon_ } = config[toast.type]

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10)
    if (toast.duration !== 0) {
      const t2 = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onRemove(toast.id), 300)
      }, toast.duration || 5000)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    return () => clearTimeout(t1)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-card-md backdrop-blur-sm',
        'transition-all duration-300',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
        base,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon_)} aria-hidden="true" />
      <p className={cn('flex-1 text-sm font-medium', text)}>{toast.message}</p>
      {toast.duration !== 0 && (
        <button
          onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
          className={cn('shrink-0 rounded-md p-0.5 transition hover:bg-black/10 dark:hover:bg-white/10', text)}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

interface ToastContainerProps {
  toasts:   Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => (
  <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 lg:bottom-4">
    {toasts.map((t) => (
      <Toast key={t.id} toast={t} onRemove={onRemove} />
    ))}
  </div>
)
