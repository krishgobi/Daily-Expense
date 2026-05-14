import React, { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import {
  TrendingUp, Banknote, CreditCard,
  ArrowDownLeft, ArrowUpRight, Clock, Sparkles,
} from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { useTransactions } from '../../hooks/useTransactions'
import { Expense } from '../../services/expenseService'
import {
  classifyExpenses, getCategoryInfo, CATEGORIES, CategoryId,
} from '../../services/categoryClassifier'
import { cn } from '../../lib/utils'

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
  const [categoryMap, setCategoryMap] = useState<Map<string, CategoryId>>(new Map())
  const [classifying, setClassifying] = useState(false)

  // Fetch ALL expenses (no limit) for analytics
  const { expenses, isLoading } = useExpenses({ limit: 500 })
  const { transactions }        = useTransactions({ limit: 500 })

  // ── Classify expenses with Groq whenever expenses change ────────────────────
  useEffect(() => {
    if (!expenses.length) return
    const unique = [...new Set(expenses.map((e) => e.purpose))]
    setClassifying(true)
    classifyExpenses(unique).then((map) => {
      setCategoryMap(map)
      setClassifying(false)
    })
  }, [expenses.length])

  // ── Filter by time window ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90
    const cutoff = subDays(new Date(), days)
    return expenses.filter((e) => new Date(e.date) >= cutoff)
  }, [expenses, timeFilter])

  // ── Trend data ──────────────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const now       = new Date()
    const days      = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90
    const startDate = subDays(now, days)
    const dateFormat = timeFilter === 'quarter' ? 'MMM dd' : 'MMM dd'

    const map = new Map<string, { date: string; cash: number; digital: number }>()
    eachDayOfInterval({ start: startDate, end: now }).forEach((d) => {
      const key = format(d, dateFormat)
      map.set(key, { date: key, cash: 0, digital: 0 })
    })
    filtered.forEach((e: Expense) => {
      const key = format(new Date(e.date), dateFormat)
      const ex  = map.get(key) ?? { date: key, cash: 0, digital: 0 }
      if (e.type === 'CASH') ex.cash    += e.amount
      else                   ex.digital += e.amount
      map.set(key, ex)
    })
    return Array.from(map.values())
  }, [filtered, timeFilter])

  // ── Category breakdown (AI-powered) ────────────────────────────────────────
  const categoryData = useMemo(() => {
    const totals = new Map<CategoryId, number>()
    for (const e of filtered) {
      const catId = categoryMap.get(e.purpose) ?? 'other'
      totals.set(catId, (totals.get(catId) ?? 0) + e.amount)
    }
    return Array.from(totals.entries())
      .map(([id, value]) => {
        const info = getCategoryInfo(id)
        return { id, name: `${info.emoji} ${info.label}`, value, color: info.color }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filtered, categoryMap])

  // ── Cash vs Digital ─────────────────────────────────────────────────────────
  const cashTotal    = filtered.filter((e) => e.type === 'CASH').reduce((s, e) => s + e.amount, 0)
  const digitalTotal = filtered.filter((e) => e.type === 'DIGITAL').reduce((s, e) => s + e.amount, 0)
  const total        = cashTotal + digitalTotal
  const pieData      = [
    { name: 'Cash',    value: cashTotal,    color: '#10b981' },
    { name: 'Digital', value: digitalTotal, color: '#2563eb' },
  ]

  // ── Transaction summary ─────────────────────────────────────────────────────
  const txBorrowed = transactions.filter((t: any) => t.transaction_type === 'BORROWED').reduce((s: number, t: any) => s + t.amount, 0)
  const txLent     = transactions.filter((t: any) => t.transaction_type === 'LENT').reduce((s: number, t: any) => s + t.amount, 0)
  const txPending  = transactions.filter((t: any) => t.status === 'PENDING').reduce((s: number, t: any) => s + t.amount, 0)

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
        {[
          { label: 'Total Expenses', value: fmt(total),       icon: TrendingUp, color: 'text-brand-600 dark:text-brand-400',    bg: 'bg-brand-50 dark:bg-brand-950/40' },
          { label: 'Cash',           value: fmt(cashTotal),   icon: Banknote,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Digital',        value: fmt(digitalTotal),icon: CreditCard, color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-950/40' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
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
        <ResponsiveContainer width="100%" height={260}>
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
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area type="monotone" dataKey="cash"    stroke="#10b981" strokeWidth={2} fill="url(#cashGrad)"    dot={false} name="Cash" />
            <Area type="monotone" dataKey="digital" stroke="#2563eb" strokeWidth={2} fill="url(#digitalGrad)" dot={false} name="Digital" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Category breakdown + Cash vs Digital */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* AI Categories — card list style */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">Spending by Category</h3>
            <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <Sparkles className="h-3 w-3" />
              AI powered
              {classifying && <span className="ml-1 animate-pulse">…</span>}
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">📊</span>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No expenses in this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryData.map(({ id, name, value, color }, index) => {
                const pct = total > 0 ? (value / total) * 100 : 0
                return (
                  <div key={id} className="group">
                    {/* Row */}
                    <div className="flex items-center gap-3 mb-1.5">
                      {/* Rank */}
                      <span className="w-5 text-xs font-bold text-gray-400 dark:text-gray-600 shrink-0 text-right">
                        {index + 1}
                      </span>
                      {/* Color dot */}
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {/* Name */}
                      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {name}
                      </span>
                      {/* Percentage */}
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0 w-10 text-right">
                        {pct.toFixed(0)}%
                      </span>
                      {/* Amount */}
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 shrink-0 w-24 text-right">
                        {fmt(value)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="ml-8 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Total row */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Cash vs Digital donut */}
        <div className="card p-5">
          <h3 className="section-title mb-5">Cash vs Digital</h3>
          {pieData.every((d) => d.value === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">💳</span>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No expenses in this period</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend cards */}
              <div className="w-full grid grid-cols-2 gap-3">
                {pieData.map((d) => {
                  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
                  return (
                    <div
                      key={d.name}
                      className="rounded-xl p-3 flex flex-col gap-1"
                      style={{ backgroundColor: `${d.color}15` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{d.name}</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmt(d.value)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{pct}% of total</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category bar chart — full width, bigger, readable */}
      {categoryData.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-5">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={categoryData.length * 44 + 20}>
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              barSize={20}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                width={160}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Amount" label={{
                position: 'right',
                formatter: (v: number) => fmt(v),
                fontSize: 11,
                fill: '#6b7280',
              }}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction summary */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Transaction Summary</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Money Borrowed', value: fmt(txBorrowed), icon: ArrowDownLeft, color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-950/40' },
            { label: 'Money Lent',     value: fmt(txLent),     icon: ArrowUpRight,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
            { label: 'Pending',        value: fmt(txPending),  icon: Clock,         color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/40' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
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
