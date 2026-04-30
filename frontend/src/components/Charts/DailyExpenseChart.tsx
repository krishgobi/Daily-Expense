import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useDailyBreakdown } from '../../hooks/useAnalytics'

const formatCurrency = (value: string | number) =>
  `₹${Number(value).toFixed(2)}`

export const DailyExpenseChart: React.FC = () => {
  const { data, isLoading } = useDailyBreakdown()

  if (isLoading) {
    return <div className="py-8 text-center text-gray-600 dark:text-gray-400">Loading chart...</div>
  }

  if (!data || data.length === 0) {
    return <div className="py-8 text-center text-gray-500 dark:text-gray-400">No expenses this month</div>
  }

  const chartData = data.map((d) => ({
    name: d.day,
    date: d.date,
    amount: d.amount,
  }))

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            formatter={formatCurrency}
          />
          <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
