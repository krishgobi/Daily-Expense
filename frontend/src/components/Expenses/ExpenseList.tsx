import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../../hooks/useExpenses'
import { FileUpload } from '../Common/FileUpload'
import { format } from 'date-fns'
import { MediaFile } from '../../services/expenseService'
import { ExpenseCardSkeleton, Skeleton } from '../UI/SkeletonLoader'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

interface ExpenseListProps {
  type?: 'CASH' | 'DIGITAL'
  showAll?: boolean
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ type, showAll = false }) => {
  const navigate = useNavigate()
  const [limit, setLimit] = useState(showAll ? 50 : 5)
  const [offset, setOffset] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploadingForId, setUploadingForId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleUpload = (id: string) => {
    setUploadError('')
    setUploadingForId(uploadingForId === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Skeleton width="150px" height="24px" />
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <ExpenseCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No expenses found. Add your first expense to get started!
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
          {type === 'CASH' ? 'Cash Expenses' : type === 'DIGITAL' ? 'Digital Expenses' : 'Recent Expenses'}
        </h2>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors">
                <div className="cursor-pointer" onClick={() => toggleExpand(expense.id)}>
                  {/* Mobile layout - stacked */}
                  <div className="lg:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            expense.type === 'CASH'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {expense.type}
                        </span>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${expense.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(expense.id)
                          }}
                          disabled={isDeleting}
                          className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(expense.id)
                          }}
                          className="text-sm font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {expandedId === expense.id ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {expense.purpose}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout - horizontal */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {expense.purpose}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          expense.type === 'CASH'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {expense.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ${expense.amount.toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(expense.id)
                        }}
                        disabled={isDeleting}
                        className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(expense.id)
                        }}
                        className="text-sm font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {expandedId === expense.id ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === expense.id && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600 space-y-3">
                    {expense.location && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{expense.location}</span>
                      </div>
                    )}
                    {expense.description && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{expense.description}</span>
                      </div>
                    )}
                    {expense.payment_method && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Payment Method:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{expense.payment_method}</span>
                      </div>
                    )}
                    
                    {/* Media Files */}
                    {expense.media && expense.media.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attached Receipts/Screenshots:</p>
                        <div className="space-y-2">
                          {expense.media.map((file: MediaFile) => (
                            <div key={file.id} className="flex items-center space-x-2">
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                              >
                                <span>📎</span>
                                <span>{file.file_name}</span>
                              </a>
                              <span className="text-xs text-gray-500">({file.file_type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Section */}
                    {uploadingForId === expense.id && (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
                        <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Upload receipt or screenshot (optional)</p>
                        {uploadError && (
                          <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                            {uploadError}
                          </div>
                        )}
                        <FileUpload
                          entityId={expense.id}
                          entityType="expense"
                          existingMedia={expense.media || []}
                          maxFiles={5}
                          onError={setUploadError}
                          onFileUpload={() => {
                            setUploadError('')
                            setUploadingForId(null)
                          }}
                        />
                      </div>
                    )}

                    {/* Upload Button */}
                    {uploadingForId !== expense.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpload(expense.id)
                        }}
                        className="mt-2 text-sm font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        📎 Upload Receipt/Screenshot
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

      {/* Show All Button - Only show when not in showAll mode */}
      {!showAll && total > limit && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const queryParams = new URLSearchParams()
              if (type) queryParams.set('type', type)
              navigate(`/expenses/all?${queryParams.toString()}`)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <>
              <ArrowRight className="h-4 w-4" />
              View All Expenses ({total} total)
            </>
          </button>
        </div>
      )}

      {/* Pagination for All Expenses Page */}
      {showAll && total > limit && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
