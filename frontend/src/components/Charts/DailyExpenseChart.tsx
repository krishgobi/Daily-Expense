import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useDailyBreakdown } from '../../hooks/useAnalytics'

export const DailyExpenseChart: React.FC = () => {
  const { data, isLoading } = useDailyBreakdown()

  if (isLoading) {
    return <div className="text-center py-8">Loading chart...</div>
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No expenses this month</div>
  }

  const chartData = data.map((d) => ({
    name: d.day,
    date: d.date,
    amount: d.amount,
  }))

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Daily Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            formatter={(value) => `₹${value.toFixed(2)}`}
          />
          <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
