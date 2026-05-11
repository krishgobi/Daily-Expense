import React, { useState } from 'react'
import { ExpenseForm } from '../components/Expenses/ExpenseForm'
import { ExpenseList } from '../components/Expenses/ExpenseList'
import { ExpenseSummary } from '../components/Dashboard/ExpenseSummary'
import { TransactionForm } from '../components/Transactions/TransactionForm'
import { TransactionList } from '../components/Transactions/TransactionList'
import { TransactionSummary } from '../components/Dashboard/TransactionSummary'
import { SpendingTrendChart } from '../components/Charts/SpendingTrendChart'
import { AppShell } from '../components/Layout/AppShell'

type FormMode = null | 'cash-expense' | 'digital-expense' | 'borrowed' | 'lent'

export const DashboardPage: React.FC = () => {
  const [formMode, setFormMode] = useState<FormMode>(null)

  return (
    <AppShell>
      <div className="space-y-10">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            A clear view of your spending, cash flow, and pending transactions.
          </p>
        </section>

        {/* Expense Summary */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Expense Summary</h2>
          <ExpenseSummary />
        </section>

        {/* Spending Trend */}
        <section>
          <SpendingTrendChart />
        </section>

        {/* Transaction Summary */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Borrowed/Lent Summary
          </h2>
          <TransactionSummary />
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              onClick={() => setFormMode('cash-expense')}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-950"
            >
              Cash Expense
            </button>
            <button
              onClick={() => setFormMode('digital-expense')}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-950"
            >
              Digital Expense
            </button>
            <button
              onClick={() => setFormMode('borrowed')}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 dark:focus:ring-red-950"
            >
              Borrowed
            </button>
            <button
              onClick={() => setFormMode('lent')}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white dark:focus:ring-gray-700"
            >
              Lent
            </button>
          </div>
        </section>

        {/* Forms */}
        {formMode && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100">
                {formMode === 'cash-expense' && 'Add Cash Expense'}
                {formMode === 'digital-expense' && 'Add Digital Expense'}
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

            {(formMode === 'cash-expense' || formMode === 'digital-expense') && (
              <ExpenseForm
                type={formMode === 'cash-expense' ? 'CASH' : 'DIGITAL'}
                onSuccess={() => setFormMode(null)}
              />
            )}

            {(formMode === 'borrowed' || formMode === 'lent') && (
              <TransactionForm
                type={formMode === 'borrowed' ? 'BORROWED' : 'LENT'}
                onSuccess={() => setFormMode(null)}
              />
            )}
          </div>
        )}

        {/* Recent Data */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Expenses</h2>
            <ExpenseList showAll={false} />
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Pending Transactions
            </h2>
            <TransactionList status="PENDING" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
