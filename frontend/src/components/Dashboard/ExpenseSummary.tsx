import React from 'react'
import { useTodaySummary, useWeekSummary, useMonthSummary } from '../../hooks/useExpenses'

export const ExpenseSummary: React.FC = () => {
  const { data: today, isLoading: todayLoading } = useTodaySummary()
  const { data: week, isLoading: weekLoading } = useWeekSummary()
  const { data: month, isLoading: monthLoading } = useMonthSummary()

  const SummaryCard = ({ label, amount, loading }: { label: string; amount?: number; loading: boolean }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-blue-600 mt-2">
        {loading ? 'Loading...' : `₹${(amount || 0).toFixed(2)}`}
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <SummaryCard label="Today" amount={today?.total} loading={todayLoading} />
      <SummaryCard label="This Week" amount={week?.total} loading={weekLoading} />
      <SummaryCard label="This Month" amount={month?.total} loading={monthLoading} />
    </div>
  )
}
