import React from 'react'
import { Line, LineChart, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { formatCurrency, formatDate } from '../../../lib/utils'

interface MobileExpenseChartProps {
  data: Array<{
    date: string
    amount: number
    category?: string
  }>
  title?: string
  height?: number
  className?: string
}

export const MobileExpenseChart: React.FC<MobileExpenseChartProps> = ({ 
  data, 
  title = 'Expense Trend', 
  height = 300,
  className 
}) => {
  const chartData = data.map(item => ({
    date: formatDate(item.date),
    amount: item.amount,
    category: item.category || 'Other'
  }))

  return (
    <div className={cn('bg-white rounded-lg shadow-sm p-4', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
            width={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value as number)}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
                    <p className="text-sm font-medium">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(payload[0].payload.date)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
