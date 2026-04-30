import React, { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import { format } from 'date-fns'

interface ExpenseListProps {
  type?: 'CASH' | 'DIGITAL'
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ type }) => {
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)

  const { expenses, total, isLoading, deleteExpense, isDeleting } = useExpenses({
    type,
    limit,
    offset,
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id)
    }
  }

  if (isLoading) {
    return <div className="py-8 text-center text-gray-600 dark:text-gray-400">Loading expenses...</div>
  }

  if (expenses.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No expenses found. Add your first expense to get started!
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Expenses</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Purpose</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
              <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/70">
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{expense.purpose}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      expense.type === 'CASH'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {expense.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">₹{expense.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={isDeleting}
                    className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
