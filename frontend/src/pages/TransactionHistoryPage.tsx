import React, { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionForm } from '../components/Transactions/TransactionForm'
import { TransactionList } from '../components/Transactions/TransactionList'
import { AppShell } from '../components/Layout/AppShell'

type TransactionType = 'BORROWED' | 'LENT' | 'ALL'
type FormMode = null | 'borrowed' | 'lent'

export const TransactionHistoryPage: React.FC = () => {
  const [transactionType, setTransactionType] = useState<TransactionType>('ALL')
  const [formMode, setFormMode] = useState<FormMode>(null)

  const getFilteredTransactions = () => {
    if (transactionType === 'ALL') return {}
    return { type: transactionType }
  }

  return (
    <AppShell>
      <div className="space-y-10">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            Transaction History
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Complete history of money borrowed and lent with full details and receipts.
          </p>
        </section>

        {/* Filter Tabs */}
        <section>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setTransactionType('ALL')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  transactionType === 'ALL'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => setTransactionType('BORROWED')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  transactionType === 'BORROWED'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Money I Borrowed
              </button>
              <button
                onClick={() => setTransactionType('LENT')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  transactionType === 'LENT'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Money I Lent
              </button>
            </nav>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
            <button
              onClick={() => setFormMode('borrowed')}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 dark:focus:ring-red-950"
            >
              I Borrowed Money
            </button>
            <button
              onClick={() => setFormMode('lent')}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white dark:focus:ring-gray-700"
            >
              I Lent Money
            </button>
          </div>
        </section>

        {/* Forms */}
        {formMode && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100">
                {formMode === 'borrowed' && 'I Borrowed Money'}
                {formMode === 'lent' && 'I Lent Money'}
              </h3>
              <button
                onClick={() => setFormMode(null)}
                className="rounded-lg px-2 text-xl text-gray-500 transition hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            <TransactionForm
              type={formMode === 'borrowed' ? 'BORROWED' : 'LENT'}
              onSuccess={() => setFormMode(null)}
            />
          </div>
        )}

        {/* Transaction List */}
        <section>
          <TransactionList 
            type={transactionType === 'ALL' ? undefined : transactionType}
            status={undefined}
          />
        </section>
      </div>
    </AppShell>
  )
}
