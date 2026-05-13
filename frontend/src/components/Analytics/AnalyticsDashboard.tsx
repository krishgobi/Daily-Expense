import React, { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { TrendingUp, Banknote, CreditCard, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { useTransactions } from '../../hooks/useTransactions'
import { Expense } from '../../services/expenseService'
import { cn } from '../../lib/utils'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-card-md dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  )
}

type TimeFilter = 'week' | 'month' | 'quarter'

export const AnalyticsDashboard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month')
  const { expenses, isLoading } = useExpenses()
  const { transactions }        = useTransactions()

  const processData = () => {
    const now = new Date()
    const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90
    const startDate = subDays(now, days)
    const dateFormat = 'MMM dd'

    const filtered = expenses.filter((e) => new Date(e.date) >= startDate)

    // Trend
    const trendMap = new Map<string, { date: string; amount: number; cash: number; digital: number }>()
    eachDayOfInterval({ start: startDate, end: now }).forEach((d) => {
      const key = format(d, dateFormat)
      trendMap.set(key, { date: key, amount: 0, cash: 0, digital: 0 })
    })
    filtered.forEach((e: Expense) => {
      const key = format(new Date(e.date), dateFormat)
      const existing = trendMap.get(key) || { date: key, amount: 0, cash: 0, digital: 0 }
      existing.amount += e.amount
      if (e.type === 'CASH') existing.cash += e.amount
      else existing.digital += e.amount
      trendMap.set(key, existing)
    })
    const trendData = Array.from(trendMap.values())

    // Categories
    const catMap = new Map<string, { name: string; value: number }>()
    filtered.forEach((e: Expense) => {
      const cat = e.purpose || 'Other'
      const ex  = catMap.get(cat) || { name: cat, value: 0 }
      ex.value += e.amount
      catMap.set(cat, ex)
    })
    const categoryData = Array.from(catMap.values()).sort((a, b) => b.value - a.value).slice(0, 8)

    const cashTotal    = filtered.filter((e: Expense) => e.type === 'CASH').reduce((s, e) => s + e.amount, 0)
    const digitalTotal = filtered.filter((e: Expense) => e.type === 'DIGITAL').reduce((s, e) => s + e.amount, 0)
    const pieData = [
      { name: 'Cash',    value: cashTotal,    color: '#10b981' },
      { name: 'Digital', value: digitalTotal, color: '#2563eb' },
    ]

    return { trendData, categoryData, pieData, cashTotal, digitalTotal, total: cashTotal + digitalTotal }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading analytics…</p>
        </div>
      </div>
    )
  }

  const { trendData, categoryData, pieData, cashTotal, digitalTotal, total } = processData()

  const summaryCards = [
    { label: 'Total Expenses', value: fmt(total),       icon: TrendingUp,    color: 'text-brand-600 dark:text-brand-400',   bg: 'bg-brand-50 dark:bg-brand-950/40' },
    { label: 'Cash',           value: fmt(cashTotal),   icon: Banknote,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Digital',        value: fmt(digitalTotal),icon: CreditCard,    color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-950/40' },
  ]

  const txSummary = [
    {
      label: 'Money Borrowed',
      value: fmt(transactions.filter((t: any) => t.transaction_type === 'BORROWED').reduce((s: number, t: any) => s + t.amount, 0)),
      icon: ArrowDownLeft, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40',
    },
    {
      label: 'Money Lent',
      value: fmt(transactions.filter((t: any) => t.transaction_type === 'LENT').reduce((s: number, t: any) => s + t.amount, 0)),
      icon: ArrowUpRight, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Pending',
      value: fmt(transactions.filter((t: any) => t.status === 'PENDING').reduce((s: number, t: any) => s + t.amount, 0)),
      icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Visualize your spending patterns.</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
          {(['week', 'month', 'quarter'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                timeFilter === f
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', bg)}>
              <Icon className={cn('h-5 w-5', color)} />
            </span>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
              <p className={cn('text-xl font-bold', color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Expense Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="digitalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="cash"    stroke="#10b981" strokeWidth={2} fill="url(#cashGrad)"    dot={false} name="Cash" />
            <Area type="monotone" dataKey="digital" stroke="#2563eb" strokeWidth={2} fill="url(#digitalGrad)" dot={false} name="Digital" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category + Pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="section-title mb-4">Top Categories</h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="horizontal" margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Amount">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Cash vs Digital</h3>
          {pieData.every((d) => d.value === 0) ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transaction summary */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Transaction Summary</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {txSummary.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', bg)}>
                <Icon className={cn('h-4 w-4', color)} />
              </span>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className={cn('text-lg font-bold', color)}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
