import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700'

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  }

  const style = {
    width: width || (variant === 'text' ? '100%' : '40px'),
    height: height || (variant === 'text' ? '1rem' : '40px'),
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses.text} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            style={style}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

// Card skeleton for expense list
export const ExpenseCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <Skeleton width="80px" height="20px" />
          <Skeleton width="120px" height="20px" />
          <Skeleton width="60px" height="24px" variant="rounded" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton width="80px" height="24px" />
          <Skeleton width="60px" height="36px" variant="rounded" />
          <Skeleton width="40px" height="36px" variant="rounded" />
        </div>
      </div>
    </div>
  )
}

// Transaction card skeleton
export const TransactionCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Skeleton width="40px" height="40px" variant="circular" />
          <div>
            <Skeleton width="120px" height="20px" />
            <Skeleton width="80px" height="16px" className="mt-1" />
          </div>
        </div>
        <Skeleton width="80px" height="24px" />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Skeleton width="60px" height="16px" />
          <Skeleton width="100px" height="16px" className="mt-1" />
        </div>
        <div>
          <Skeleton width="70px" height="16px" />
          <Skeleton width="90px" height="16px" className="mt-1" />
        </div>
      </div>
    </div>
  )
}

// Summary card skeleton
export const SummaryCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
      <Skeleton width="120px" height="20px" className="mb-4" />
      <Skeleton width="80px" height="32px" />
      <Skeleton width="140px" height="16px" className="mt-2" />
    </div>
  )
}

// Dashboard skeleton loader
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>

      {/* Recent expenses */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Skeleton width="150px" height="24px" />
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <ExpenseCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Form skeleton loader
export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="100px" height="16px" />
          <Skeleton height="48px" variant="rounded" />
        </div>
      ))}
      <Skeleton width="120px" height="48px" variant="rounded" />
    </div>
  )
}
