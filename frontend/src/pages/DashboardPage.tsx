import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ExpenseForm } from '../components/Expenses/ExpenseForm'
import { ExpenseList } from '../components/Expenses/ExpenseList'
import { ExpenseSummary } from '../components/Dashboard/ExpenseSummary'
import { TransactionForm } from '../components/Transactions/TransactionForm'
import { TransactionList } from '../components/Transactions/TransactionList'
import { TransactionSummary } from '../components/Dashboard/TransactionSummary'

type FormMode = null | 'cash-expense' | 'digital-expense' | 'borrowed' | 'lent'

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [formMode, setFormMode] = useState<FormMode>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                💰 Smart Expense Manager
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.full_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Expense Summary */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Expense Summary</h2>
          <ExpenseSummary />
        </section>

        {/* Transaction Summary */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🤝 Borrowed/Lent Summary</h2>
          <TransactionSummary />
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-wrap">
            <button
              onClick={() => setFormMode('cash-expense')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              💵 Cash Expense
            </button>
            <button
              onClick={() => setFormMode('digital-expense')}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              📱 Digital Expense
            </button>
            <button
              onClick={() => setFormMode('borrowed')}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              🏦 Borrowed
            </button>
            <button
              onClick={() => setFormMode('lent')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              🤝 Lent
            </button>
          </div>
        </section>

        {/* Forms */}
        {formMode && (
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {formMode === 'cash-expense' && 'Add Cash Expense'}
                {formMode === 'digital-expense' && 'Add Digital Expense'}
                {formMode === 'borrowed' && 'I Borrowed Money'}
                {formMode === 'lent' && 'I Lent Money'}
              </h3>
              <button
                onClick={() => setFormMode(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Recent Expenses</h2>
            <ExpenseList />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔄 Pending Transactions</h2>
            <TransactionList status="PENDING" />
          </div>
        </div>
      </main>
    </div>
  )
}
