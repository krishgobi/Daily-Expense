import React from 'react'
import { PieChart, PieChart as RechartsPieChart, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../../lib/utils'

interface MobileAnalyticsDashboardProps {
  data: {
    totalExpenses: number
    expensesByCategory: Array<{ category: string; amount: number }>
    monthlyTrend: Array<{ month: string; amount: number }>
  }
  className?: string
}

export const MobileAnalyticsDashboard: React.FC<MobileAnalyticsDashboardProps> = ({ 
  data, 
  className 
}) => {
  const pieData = data.expensesByCategory.map(item => ({
    name: item.category,
    value: item.amount,
    color: getCategoryColor(item.category)
  }))

  const getCategoryColor = (category: string) => {
    const colors: {
      'Food': '#10b981',
      'Transport': '#3b82f6',
      'Entertainment': '#f59e0b',
      'Shopping': '#ef4444',
      'Bills': '#dc2626',
      'Healthcare': '#8b5cf6',
    }
    return colors[category as keyof typeof colors] || '#6b7280'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Total Expenses
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(data.totalExpenses)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            This Month
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(data.monthlyTrend[data.monthlyTrend.length - 1]?.amount || 0)}
          </p>
        </div>
      </div>

      {/* Expense by Category Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Expenses by Category
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
              outerRadius={60}
              fill="#8884d8"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data.monthlyTrend.map(item => ({
                name: item.month,
                value: item.amount,
                fill: getMonthColor(item.month)
              }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
              outerRadius={40}
              fill="#8884d8"
            >
              {data.monthlyTrend.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const getMonthColor = (month: string) => {
  const colors = [
    '#3b82f6', '#10b981', '#059669', '#dc2626', '#d97706', '#f59e0b', '#6b7280'
  ]
  return colors[parseInt(month) % colors.length] || '#8884d8'
}
