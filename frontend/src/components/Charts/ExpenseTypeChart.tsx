import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTypeBreakdown } from '../../hooks/useAnalytics'

const formatCurrency = (value: string | number) =>
  `₹${Number(value).toFixed(2)}`

export const ExpenseTypeChart: React.FC = () => {
  const { data, isLoading } = useTypeBreakdown()

  if (isLoading) {
    return <div className="py-8 text-center text-gray-600 dark:text-gray-400">Loading chart...</div>
  }

  if (!data) {
    return <div className="py-8 text-center text-gray-500 dark:text-gray-400">No data available</div>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Cash vs Digital</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={formatCurrency} />
          <Bar dataKey="amount" fill="#8884d8" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/70 dark:bg-green-950/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">Cash</p>
          <p className="text-2xl font-bold text-green-600">₹{data.CASH.amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{data.CASH.percentage}% • {data.CASH.count} transactions</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/70 dark:bg-blue-950/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">Digital</p>
          <p className="text-2xl font-bold text-blue-600">₹{data.DIGITAL.amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{data.DIGITAL.percentage}% • {data.DIGITAL.count} transactions</p>
        </div>
      </div>
    </div>
  )
}
