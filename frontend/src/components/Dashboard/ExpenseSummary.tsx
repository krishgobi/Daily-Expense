import React from 'react'
import { TrendingDown, Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { useTodaySummary, useWeekSummary, useMonthSummary } from '../../hooks/useExpenses'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label:   string
  amount?: number
  loading: boolean
  icon:    React.ReactNode
  color:   string
  bgColor: string
}

const StatCard: React.FC<StatCardProps> = ({ label, amount, loading, icon, color, bgColor }) => (
  <div className="card p-5 flex flex-col gap-3 card-hover">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', bgColor)}>
        {icon}
      </span>
    </div>

    {loading ? (
      <div className="space-y-2">
        <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    ) : (
      <div>
        <p className={cn('text-2xl font-bold tracking-tight', color)}>
          ₹{(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Total spent</p>
      </div>
    )}
  </div>
)

export const ExpenseSummary: React.FC = () => {
  const { data: today, isLoading: todayLoading } = useTodaySummary()
  const { data: week,  isLoading: weekLoading  } = useWeekSummary()
  const { data: month, isLoading: monthLoading } = useMonthSummary()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Today"
        amount={today?.total}
        loading={todayLoading}
        icon={<Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        color="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-50 dark:bg-blue-950/40"
      />
      <StatCard
        label="This Week"
        amount={week?.total}
        loading={weekLoading}
        icon={<CalendarDays className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
        color="text-violet-600 dark:text-violet-400"
        bgColor="bg-violet-50 dark:bg-violet-950/40"
      />
      <StatCard
        label="This Month"
        amount={month?.total}
        loading={monthLoading}
        icon={<CalendarRange className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
        color="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-50 dark:bg-emerald-950/40"
      />
    </div>
  )
}
