import React, { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { TransactionForm } from '../components/Transactions/TransactionForm'
import { TransactionList } from '../components/Transactions/TransactionList'
import { AppShell } from '../components/Layout/AppShell'
import { Modal } from '../components/UI/Modal'
import { cn } from '../lib/utils'

type TransactionType = 'BORROWED' | 'LENT' | 'ALL'
type FormMode        = null | 'borrowed' | 'lent'

const tabs: { id: TransactionType; label: string }[] = [
  { id: 'ALL',      label: 'All' },
  { id: 'BORROWED', label: 'I Borrowed' },
  { id: 'LENT',     label: 'I Lent' },
]

export const TransactionHistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TransactionType>('ALL')
  const [formMode, setFormMode]   = useState<FormMode>(null)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">Track money you've borrowed and lent.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFormMode('borrowed')}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 active:scale-[0.98]"
            >
              <ArrowDownLeft className="h-4 w-4" />
              I Borrowed
            </button>
            <button
              onClick={() => setFormMode('lent')}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:scale-[0.98]"
            >
              <ArrowUpRight className="h-4 w-4" />
              I Lent
            </button>
          </div>
        </div>

        {/* Tab filter */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px',
                activeTab === id
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <TransactionList
          type={activeTab === 'ALL' ? undefined : activeTab}
          status={undefined}
        />
      </div>

      {/* Form modal */}
      <Modal
        open={!!formMode}
        onClose={() => setFormMode(null)}
        title={formMode === 'borrowed' ? 'I Borrowed Money' : 'I Lent Money'}
        size="md"
      >
        {formMode && (
          <TransactionForm
            type={formMode === 'borrowed' ? 'BORROWED' : 'LENT'}
            onSuccess={() => setFormMode(null)}
          />
        )}
      </Modal>
    </AppShell>
  )
}
