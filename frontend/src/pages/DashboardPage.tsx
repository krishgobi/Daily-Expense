import React, { useState } from 'react'
import { Banknote, CreditCard, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { ExpenseForm } from '../components/Expenses/ExpenseForm'
import { ExpenseList } from '../components/Expenses/ExpenseList'
import { ExpenseSummary } from '../components/Dashboard/ExpenseSummary'
import { TransactionForm } from '../components/Transactions/TransactionForm'
import { TransactionList } from '../components/Transactions/TransactionList'
import { TransactionSummary } from '../components/Dashboard/TransactionSummary'
import { SpendingTrendChart } from '../components/Charts/SpendingTrendChart'
import { AppShell } from '../components/Layout/AppShell'
import { Modal } from '../components/UI/Modal'
import { cn } from '../lib/utils'

type FormMode = null | 'cash-expense' | 'digital-expense' | 'borrowed' | 'lent'

const quickActions = [
  {
    id:    'cash-expense' as FormMode,
    label: 'Cash Expense',
    icon:  Banknote,
    color: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/40',
  },
  {
    id:    'digital-expense' as FormMode,
    label: 'Digital Expense',
    icon:  CreditCard,
    color: 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500/40',
  },
  {
    id:    'borrowed' as FormMode,
    label: 'I Borrowed',
    icon:  ArrowDownLeft,
    color: 'bg-red-600 hover:bg-red-700 focus:ring-red-500/40',
  },
  {
    id:    'lent' as FormMode,
    label: 'I Lent',
    icon:  ArrowUpRight,
    color: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500/40',
  },
]

const formTitle: Record<NonNullable<FormMode>, string> = {
  'cash-expense':    'Add Cash Expense',
  'digital-expense': 'Add Digital Expense',
  'borrowed':        'I Borrowed Money',
  'lent':            'I Lent Money',
}

export const DashboardPage: React.FC = () => {
  const [formMode, setFormMode] = useState<FormMode>(null)

  return (
    <AppShell>
      <div className="space-y-8">

        {/* Page header */}
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your spending overview at a glance.</p>
        </div>

        {/* Expense summary cards */}
        <ExpenseSummary />

        {/* Quick actions */}
        <section>
          <h2 className="section-title mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setFormMode(id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition',
                  'focus:outline-none focus:ring-2 active:scale-[0.98]',
                  color,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Spending trend */}
        <SpendingTrendChart />

        {/* Transaction summary */}
        <section>
          <h2 className="section-title mb-3">Borrowed / Lent Summary</h2>
          <TransactionSummary />
        </section>

        {/* Recent data */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="section-title mb-3">Recent Expenses</h2>
            <ExpenseList showAll={false} />
          </section>
          <section>
            <h2 className="section-title mb-3">Pending Transactions</h2>
            <TransactionList status="PENDING" />
          </section>
        </div>
      </div>

      {/* Form modal */}
      <Modal
        open={!!formMode}
        onClose={() => setFormMode(null)}
        title={formMode ? formTitle[formMode] : ''}
        size="md"
      >
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
      </Modal>
    </AppShell>
  )
}
