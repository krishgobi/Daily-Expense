import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSpendingTrend } from '../../hooks/useAnalytics'

const formatCurrency = (value: string | number) =>
  `₹${Number(value).toFixed(2)}`

export const SpendingTrendChart: React.FC = () => {
  const { data, isLoading } = useSpendingTrend(6)

  if (isLoading) {
    return <div className="py-8 text-center text-gray-600 dark:text-gray-400">Loading chart...</div>
  }

  if (!data?.months || data.months.length === 0) {
    return <div className="py-8 text-center text-gray-500 dark:text-gray-400">No data available</div>
  }

  const chartData = data.months.map((m) => ({
    name: m.month_short,
    total: m.total,
  }))

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">6-Month Spending Trend</h3>
        <span className={`text-sm font-semibold ${data.trend.trend === 'UP' ? 'text-red-600' : data.trend.trend === 'DOWN' ? 'text-green-600' : 'text-gray-600'}`}>
          {data.trend.trend === 'UP' ? '📈' : data.trend.trend === 'DOWN' ? '📉' : '→'} {data.trend.percentage_change > 0 ? '+' : ''}{data.trend.percentage_change}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={formatCurrency} />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Spending" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
