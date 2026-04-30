import React from 'react'
import { useTransactionsSummary, useOverdueTransactions } from '../../hooks/useTransactions'

export const TransactionSummary: React.FC = () => {
  const { data: summary, isLoading: summaryLoading } = useTransactionsSummary()
  const { data: overdue, isLoading: overdueLoading } = useOverdueTransactions()

  if (summaryLoading || overdueLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Borrowed Summary */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 shadow rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4">💰 Money I Owe</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-red-700">Total Borrowed</p>
            <p className="text-3xl font-bold text-red-600">₹{(summary?.total_borrowed || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-red-700">Pending</p>
            <p className="text-2xl font-bold text-red-500">₹{(summary?.pending_borrowed || 0).toFixed(2)}</p>
          </div>
          {summary?.overdue_borrowed_count! > 0 && (
            <div className="bg-red-200 border border-red-400 rounded p-2">
              <p className="text-sm font-semibold text-red-900">
                ⚠️ {summary?.overdue_borrowed_count} overdue - ₹{(summary?.overdue_borrowed_amount || 0).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lent Summary */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 shadow rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">💵 Money Owed to Me</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-green-700">Total Lent</p>
            <p className="text-3xl font-bold text-green-600">₹{(summary?.total_lent || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Pending Collection</p>
            <p className="text-2xl font-bold text-green-500">₹{(summary?.pending_lent || 0).toFixed(2)}</p>
          </div>
          {summary?.overdue_lent_count! > 0 && (
            <div className="bg-yellow-200 border border-yellow-400 rounded p-2">
              <p className="text-sm font-semibold text-yellow-900">
                ⚠️ {summary?.overdue_lent_count} overdue - ₹{(summary?.overdue_lent_amount || 0).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
