import React, { useState } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { FileUpload } from '../Common/FileUpload'
import { format, differenceInDays } from 'date-fns'

interface TransactionListProps {
  type?: 'BORROWED' | 'LENT'
  status?: 'PENDING' | 'COMPLETED'
}

export const TransactionList: React.FC<TransactionListProps> = ({ type, status }) => {
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [uploadingForId, setUploadingForId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')

  const { transactions, total, isLoading, completeTransaction, isCompleting, deleteTransaction } = useTransactions({
    type,
    status,
    limit,
    offset,
  })

  const getOverdueStatus = (transaction: any) => {
    if (!transaction.expected_return_date) return null
    const days = differenceInDays(new Date(), new Date(transaction.expected_return_date))
    return days > 0 ? days : null
  }

  const handleComplete = (id: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    completeTransaction({ id, actualReturnDate: today })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading transactions...</div>
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found.
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        {type === 'BORROWED' ? 'Money I Borrowed' : type === 'LENT' ? 'Money I Lent' : 'Transactions'}
      </h2>

      <div className="space-y-4">
        {transactions.map((transaction) => {
          const overdueStatus = getOverdueStatus(transaction)
          const isOverdue = overdueStatus && overdueStatus > 0
          const isPending = transaction.status === 'PENDING'

          return (
            <div
              key={transaction.id}
              className={`border rounded-lg p-4 ${
                isOverdue ? 'border-red-300 bg-red-50' : isPending ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{transaction.person_name}</h3>
                  <p className="text-sm text-gray-600">{transaction.purpose}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹{transaction.amount.toFixed(2)}</p>
                  <p className="text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        transaction.status === 'PENDING'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Given on</p>
                  <p className="font-semibold">{format(new Date(transaction.given_date), 'MMM dd, yyyy')}</p>
                </div>
                {transaction.expected_return_date && (
                  <div>
                    <p className="text-gray-600">Expected Return</p>
                    <p
                      className={`font-semibold ${
                        isOverdue ? 'text-red-600' : isPending ? 'text-yellow-600' : 'text-gray-600'
                      }`}
                    >
                      {format(new Date(transaction.expected_return_date), 'MMM dd, yyyy')}
                      {isOverdue && <span className="ml-2 text-red-600">({overdueStatus}d overdue)</span>}
                    </p>
                  </div>
                )}
              </div>

              {transaction.actual_return_date && (
                <div className="text-sm mb-4">
                  <p className="text-gray-600">Completed on</p>
                  <p className="font-semibold">{format(new Date(transaction.actual_return_date), 'MMM dd, yyyy')}</p>
                </div>
              )}

              {transaction.media && transaction.media.length > 0 && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-white/70 p-3">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Attached proof</p>
                  <div className="space-y-2">
                    {transaction.media.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-blue-700 hover:text-blue-900"
                      >
                        {file.file_name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {uploadingForId === transaction.id && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-800">Upload receipt, screenshot, or PDF</p>
                  {uploadError && (
                    <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                      {uploadError}
                    </div>
                  )}
                  <FileUpload
                    entityId={transaction.id}
                    entityType="transaction"
                    existingMedia={transaction.media || []}
                    maxFiles={5}
                    onError={setUploadError}
                    onFileUpload={() => {
                      setUploadError('')
                      setUploadingForId(null)
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadError('')
                    setUploadingForId(uploadingForId === transaction.id ? null : transaction.id)
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {uploadingForId === transaction.id ? 'Close Upload' : 'Upload Proof'}
                </button>

                {transaction.status === 'PENDING' && (
                  <>
                  <button
                    onClick={() => handleComplete(transaction.id)}
                    disabled={isCompleting}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {isCompleting ? 'Marking...' : 'Mark Complete'}
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
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
