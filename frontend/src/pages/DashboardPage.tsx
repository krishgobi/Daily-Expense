import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ExpenseForm } from '../components/Expenses/ExpenseForm'
import { ExpenseList } from '../components/Expenses/ExpenseList'
import { ExpenseSummary } from '../components/Dashboard/ExpenseSummary'

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseType, setExpenseType] = useState<'CASH' | 'DIGITAL'>('CASH')

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
        {/* Summary Cards */}
        <ExpenseSummary />

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => {
                setExpenseType('CASH')
                setShowAddExpense(true)
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              💵 Add Cash Expense
            </button>
            <button
              onClick={() => {
                setExpenseType('DIGITAL')
                setShowAddExpense(true)
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📱 Add Digital Expense
            </button>
          </div>
        </div>

        {/* Add Expense Modal/Form */}
        {showAddExpense && (
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Expense</h3>
              <button
                onClick={() => setShowAddExpense(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ExpenseForm type={expenseType} onSuccess={() => setShowAddExpense(false)} />
          </div>
        )}

        {/* Recent Expenses */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
          <ExpenseList />
        </div>
      </main>
    </div>
  )
}
