import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { useTypeBreakdown } from '../../hooks/useAnalytics'

export const ExpenseTypeChart: React.FC = () => {
  const { data, isLoading } = useTypeBreakdown()

  if (isLoading) {
    return <div className="text-center py-8">Loading chart...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">No data available</div>
  }

  const chartData = [
    {
      name: 'Cash',
      amount: data.CASH.amount,
      percentage: data.CASH.percentage,
      fill: '#22C55E',
    },
    {
      name: 'Digital',
      amount: data.DIGITAL.amount,
      percentage: data.DIGITAL.percentage,
      fill: '#3B82F6',
    },
  ]

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Cash vs Digital</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
          <Bar dataKey="amount" fill="#8884d8" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <p className="text-sm text-gray-600">Cash</p>
          <p className="text-2xl font-bold text-green-600">₹{data.CASH.amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{data.CASH.percentage}% • {data.CASH.count} transactions</p>
        </div>
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-sm text-gray-600">Digital</p>
          <p className="text-2xl font-bold text-blue-600">₹{data.DIGITAL.amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{data.DIGITAL.percentage}% • {data.DIGITAL.count} transactions</p>
        </div>
      </div>
    </div>
  )
}
