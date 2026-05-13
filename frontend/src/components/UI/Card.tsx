import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

export const Card: React.FC<CardProps> = ({
  hover   = false,
  glass   = false,
  padding = 'none',
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'rounded-2xl border border-gray-200 bg-white shadow-card',
      'dark:border-gray-800 dark:bg-gray-900',
      hover && 'card-hover cursor-pointer',
      glass && 'glass',
      paddingMap[padding],
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({ action, className, children, ...props }) => (
  <div
    className={cn(
      'flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800',
      className,
    )}
    {...props}
  >
    <div className="min-w-0">{children}</div>
    {action && <div className="ml-4 shrink-0">{action}</div>}
  </div>
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-800',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)
