import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSpendingTrend } from '../../hooks/useAnalytics'

export const SpendingTrendChart: React.FC = () => {
  const { data, isLoading } = useSpendingTrend(6)

  if (isLoading) {
    return <div className="text-center py-8">Loading chart...</div>
  }

  if (!data?.months || data.months.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>
  }

  const chartData = data.months.map((m) => ({
    name: m.month_short,
    total: m.total,
  }))

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">6-Month Spending Trend</h3>
        <span className={`text-sm font-semibold ${data.trend.trend === 'UP' ? 'text-red-600' : data.trend.trend === 'DOWN' ? 'text-green-600' : 'text-gray-600'}`}>
          {data.trend.trend === 'UP' ? '📈' : data.trend.trend === 'DOWN' ? '📉' : '→'} {data.trend.percentage_change > 0 ? '+' : ''}{data.trend.percentage_change}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Spending" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
