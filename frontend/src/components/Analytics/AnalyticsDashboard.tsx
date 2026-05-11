import React, { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import { useTransactions } from '../../hooks/useTransactions'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { Expense } from '../../services/expenseService'

interface AnalyticsData {
  weeklyTrend: any[]
  categoryBreakdown: any[]
  cashVsDigital: any[]
}

export const AnalyticsDashboard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('week')
  const { expenses } = useExpenses()
  const { transactions } = useTransactions()

  // Process data for charts
  const processAnalyticsData = (): AnalyticsData => {
    const now = new Date()
    let startDate: Date
    let dateFormat: string
    let groupBy: 'day' | 'week' | 'month'

    switch (timeFilter) {
      case 'week':
        startDate = subDays(now, 7)
        dateFormat = 'MMM dd'
        groupBy = 'day'
        break
      case 'month':
        startDate = subDays(now, 30)
        dateFormat = 'MMM dd'
        groupBy = 'day'
        break
      case 'quarter':
        startDate = subDays(now, 90)
        dateFormat = 'MMM dd'
        groupBy = 'week'
        break
      default:
        startDate = subDays(now, 7)
        dateFormat = 'MMM dd'
        groupBy = 'day'
    }

    // Filter expenses by date range
    const filteredExpenses = expenses.filter(expense => 
      new Date(expense.date) >= startDate
    )

    // Weekly trend data
    const trendMap = new Map()
    const interval = eachDayOfInterval({ start: startDate, end: now })
    
    interval.forEach(date => {
      const dateKey = format(date, dateFormat)
      trendMap.set(dateKey, { date: dateKey, amount: 0, cash: 0, digital: 0 })
    })

    filteredExpenses.forEach((expense: Expense) => {
      const dateKey = format(new Date(expense.date), dateFormat)
      const existing = trendMap.get(dateKey) || { date: dateKey, amount: 0, cash: 0, digital: 0 }
      existing.amount += expense.amount
      if (expense.type === 'CASH') {
        existing.cash += expense.amount
      } else {
        existing.digital += expense.amount
      }
      trendMap.set(dateKey, existing)
    })

    const weeklyTrend = Array.from(trendMap.values())

    // Category breakdown
    const categoryMap = new Map()
    filteredExpenses.forEach((expense: Expense) => {
      const category = expense.purpose || 'Other'
      const existing = categoryMap.get(category) || { name: category, value: 0 }
      existing.value += expense.amount
      categoryMap.set(category, existing)
    })

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 categories

    // Cash vs Digital breakdown
    const cashTotal = filteredExpenses
      .filter((e: Expense) => e.type === 'CASH')
      .reduce((sum: number, e: Expense) => sum + e.amount, 0)
    
    const digitalTotal = filteredExpenses
      .filter((e: Expense) => e.type === 'DIGITAL')
      .reduce((sum: number, e: Expense) => sum + e.amount, 0)

    const cashVsDigital = [
      { name: 'Cash', value: cashTotal, color: '#10b981' },
      { name: 'Digital', value: digitalTotal, color: '#3b82f6' }
    ]

    return {
      weeklyTrend,
      categoryBreakdown,
      cashVsDigital
    }
  }

  const data = processAnalyticsData()

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Analytics Dashboard
        </h1>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Expenses
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ₹{data.weeklyTrend.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Cash Expenses
          </h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₹{data.cashVsDigital[0]?.value.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Digital Expenses
          </h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ₹{data.cashVsDigital[1]?.value.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Expense Trend ({timeFilter})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Total Expense"
              />
              <Line 
                type="monotone" 
                dataKey="cash" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                name="Cash"
              />
              <Line 
                type="monotone" 
                dataKey="digital" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 3 }}
                name="Digital"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top Categories
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.categoryBreakdown} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash vs Digital Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Cash vs Digital
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.cashVsDigital}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.cashVsDigital.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Transaction Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Money Borrowed</p>
            <p className="text-xl font-semibold text-red-600 dark:text-red-400">
              ₹{transactions
                .filter((t: any) => t.transaction_type === 'BORROWED')
                .reduce((sum: number, t: any) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Money Lent</p>
            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
              ₹{transactions
                .filter((t: any) => t.transaction_type === 'LENT')
                .reduce((sum: number, t: any) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-xl font-semibold text-orange-600 dark:text-orange-400">
              ₹{transactions
                .filter((t: any) => t.status === 'PENDING')
                .reduce((sum: number, t: any) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
