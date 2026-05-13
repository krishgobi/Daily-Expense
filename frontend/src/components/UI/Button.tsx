import React from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  icon?:     React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus:ring-brand-500/40 disabled:bg-brand-300',
  secondary:
    'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-300/60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600',
  ghost:
    'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300/60 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500/40 disabled:bg-red-300',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-500/40 disabled:bg-emerald-300',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8  px-3 text-xs  gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm  gap-2   rounded-xl',
  lg: 'h-11 px-5 text-sm  gap-2   rounded-xl',
}

export const Button: React.FC<ButtonProps> = ({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition',
        'focus:outline-none focus:ring-2',
        'active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
}
