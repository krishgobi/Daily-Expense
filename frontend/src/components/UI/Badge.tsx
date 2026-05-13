import React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' | 'orange'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?:     boolean
}

const variantMap: Record<BadgeVariant, string> = {
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  gray:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  purple: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

const dotMap: Record<BadgeVariant, string> = {
  blue:   'bg-blue-500',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  yellow: 'bg-amber-500',
  gray:   'bg-gray-400',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
}

export const Badge: React.FC<BadgeProps> = ({
  variant  = 'gray',
  dot      = false,
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantMap[variant],
      className,
    )}
    {...props}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotMap[variant])} />}
    {children}
  </span>
)
