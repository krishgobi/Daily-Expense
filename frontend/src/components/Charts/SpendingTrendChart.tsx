import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useSpendingTrend } from '../../hooks/useAnalytics'
import { cn } from '../../lib/utils'

const fmt = (v: number) =>
  `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-card-md dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {fmt(entry.value)}
        </p>
      ))}
    </div>
  )
}

export const SpendingTrendChart: React.FC = () => {
  const { data, isLoading } = useSpendingTrend(6)

  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  if (!data?.months || data.months.length === 0) {
    return (
      <div className="card p-5 flex items-center justify-center h-48">
        <p className="text-sm text-gray-500 dark:text-gray-400">No spending data available yet.</p>
      </div>
    )
  }

  const chartData = data.months.map((m) => ({ name: m.month_short, total: m.total }))
  const trend     = data.trend.trend
  const pct       = data.trend.percentage_change

  const TrendIcon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus
  const trendColor = trend === 'UP'
    ? 'text-red-600 dark:text-red-400'
    : trend === 'DOWN'
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-gray-500 dark:text-gray-400'

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="section-title">6-Month Spending Trend</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Monthly expense overview</p>
        </div>
        <div className={cn('flex items-center gap-1 text-sm font-semibold', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          {pct > 0 ? '+' : ''}{pct}%
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#spendGrad)"
            dot={{ fill: '#2563eb', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 0 }}
            name="Spending"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
