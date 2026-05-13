import React from 'react'
import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { useTransactionsSummary, useOverdueTransactions } from '../../hooks/useTransactions'
import { cn } from '../../lib/utils'

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const TransactionSummary: React.FC = () => {
  const { data: summary, isLoading: summaryLoading } = useTransactionsSummary()
  const { data: overdue, isLoading: overdueLoading  } = useOverdueTransactions()

  if (summaryLoading || overdueLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card p-5 space-y-4 animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Money I Owe */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40">
              <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Money I Owe</span>
          </div>
          {(summary?.overdue_borrowed_count ?? 0) > 0 && (
            <span className="badge-red">
              {summary?.overdue_borrowed_count} overdue
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Borrowed</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {fmt(summary?.total_borrowed || 0)}
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              {fmt(summary?.pending_borrowed || 0)}
            </span>
          </div>
        </div>

        {(summary?.overdue_borrowed_count ?? 0) > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-xs font-medium text-red-700 dark:text-red-300">
              {summary?.overdue_borrowed_count} overdue — {fmt(summary?.overdue_borrowed_amount || 0)}
            </p>
          </div>
        )}
      </div>

      {/* Money Owed to Me */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Money Owed to Me</span>
          </div>
          {(summary?.overdue_lent_count ?? 0) > 0 && (
            <span className="badge-yellow">
              {summary?.overdue_lent_count} overdue
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Lent</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {fmt(summary?.total_lent || 0)}
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <span className="text-xs text-gray-500 dark:text-gray-400">Pending Collection</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {fmt(summary?.pending_lent || 0)}
            </span>
          </div>
        </div>

        {(summary?.overdue_lent_count ?? 0) > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {summary?.overdue_lent_count} overdue — {fmt(summary?.overdue_lent_amount || 0)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
