import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FloatingActionButtonProps {
  onClick:    () => void
  icon?:      React.ReactNode
  label?:     string
  className?: string
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon      = <Plus className="h-5 w-5" />,
  label,
  className,
}) => (
  <button
    onClick={onClick}
    aria-label={label || 'Add'}
    className={cn(
      'fixed bottom-20 right-4 z-40 lg:bottom-6',
      'flex items-center gap-2 rounded-2xl',
      'bg-brand-600 text-white shadow-lg shadow-brand-600/30',
      'transition hover:bg-brand-700 hover:scale-105 active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
      label ? 'px-4 py-3 text-sm font-semibold' : 'h-13 w-13 justify-center',
      className,
    )}
  >
    {icon}
    {label && <span>{label}</span>}
  </button>
)
