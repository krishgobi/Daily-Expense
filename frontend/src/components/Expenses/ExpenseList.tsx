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
    return <div className="text-center py-8">Loading expenses...</div>
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No expenses found. Add your first expense to get started!
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Recent Expenses</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Date</th>
              <th className="text-left py-2 px-4">Purpose</th>
              <th className="text-left py-2 px-4">Category</th>
              <th className="text-left py-2 px-4">Type</th>
              <th className="text-right py-2 px-4">Amount</th>
              <th className="text-center py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                <td className="py-3 px-4">{expense.purpose}</td>
                <td className="py-3 px-4">{expense.category_id ? 'Category' : 'Uncategorized'}</td>
                <td className="py-3 px-4">
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
                <td className="py-3 px-4 text-right font-semibold">₹{expense.amount.toFixed(2)}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
