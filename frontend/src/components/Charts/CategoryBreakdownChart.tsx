import React from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { useCategoryBreakdown } from '../../hooks/useAnalytics'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#95A5A6']

export const CategoryBreakdownChart: React.FC = () => {
  const { data, isLoading } = useCategoryBreakdown()

  if (isLoading) {
    return <div className="text-center py-8">Loading chart...</div>
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No expenses yet</div>
  }

  const chartData = data.map((cat) => ({
    name: `${cat.icon} ${cat.name}`,
    value: cat.amount,
    percentage: cat.percentage,
  }))

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} (${percentage}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((cat, idx) => (
          <div key={cat.name} className="text-sm">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span>{cat.icon} {cat.name}</span>
            </div>
            <div className="text-gray-600 text-xs ml-5">₹{cat.amount.toFixed(2)} ({cat.percentage}%)</div>
          </div>
        ))}
      </div>
    </div>
  )
}
