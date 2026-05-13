import React from 'react'
import { cn } from '../../lib/utils'

/* ─── Base Skeleton ──────────────────────────────────────────────────────── */
interface SkeletonProps {
  className?: string
  variant?:   'text' | 'circular' | 'rectangular' | 'rounded'
  width?:     string | number
  height?:    string | number
  lines?:     number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant   = 'text',
  width,
  height,
  lines     = 1,
}) => {
  const base = 'animate-pulse bg-gray-200 dark:bg-gray-700/60'

  const variantClass = {
    text:        'h-4 rounded',
    circular:    'rounded-full',
    rectangular: '',
    rounded:     'rounded-xl',
  }[variant]

  const style = {
    width:  width  || (variant === 'text' ? '100%' : '40px'),
    height: height || (variant === 'text' ? '1rem' : '40px'),
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, variantClass, i === lines - 1 ? 'w-3/4' : 'w-full')}
            style={style}
          />
        ))}
      </div>
    )
  }

  return <div className={cn(base, variantClass, className)} style={style} />
}

/* ─── Expense card skeleton ──────────────────────────────────────────────── */
export const ExpenseCardSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 animate-pulse">
    <div className="h-8 w-8 rounded-xl bg-gray-200 dark:bg-gray-700/60 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700/60" />
      <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800/60" />
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <div className="h-5 w-14 rounded-full bg-gray-100 dark:bg-gray-800/60" />
      <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700/60" />
    </div>
  </div>
)

/* ─── Transaction card skeleton ──────────────────────────────────────────── */
export const TransactionCardSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 animate-pulse">
    <div className="h-8 w-8 rounded-xl bg-gray-200 dark:bg-gray-700/60 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700/60" />
      <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800/60" />
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-gray-800/60" />
      <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700/60" />
    </div>
  </div>
)

/* ─── Summary card skeleton ──────────────────────────────────────────────── */
export const SummaryCardSkeleton: React.FC = () => (
  <div className="card p-5 space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700/60" />
      <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-gray-800/60" />
    </div>
    <div className="h-7 w-28 rounded bg-gray-200 dark:bg-gray-700/60" />
    <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800/60" />
  </div>
)

/* ─── Dashboard skeleton ─────────────────────────────────────────────────── */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
    </div>
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="h-5 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700/60" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => <ExpenseCardSkeleton key={i} />)}
    </div>
  </div>
)

/* ─── Form skeleton ──────────────────────────────────────────────────────── */
export const FormSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-700/60" />
        <div className="h-11 w-full rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    ))}
    <div className="h-11 w-full rounded-xl bg-gray-200 dark:bg-gray-700/60" />
  </div>
)
