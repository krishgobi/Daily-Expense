import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ChevronDown, ChevronUp, ArrowRight, Trash2,
  Paperclip, Receipt, Banknote, CreditCard, Pencil,
} from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { FileUpload } from '../Common/FileUpload'
import { MediaFile } from '../../services/expenseService'
import { ExpenseCardSkeleton, Skeleton } from '../UI/SkeletonLoader'
import { Badge } from '../UI/Badge'
import { EmptyState } from '../UI/EmptyState'
import { Button } from '../UI/Button'
import { Modal } from '../UI/Modal'
import { ExpenseEditForm } from './ExpenseEditForm'
import { cn } from '../../lib/utils'

interface ExpenseListProps {
  type?:    'CASH' | 'DIGITAL'
  showAll?: boolean
}

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const ExpenseList: React.FC<ExpenseListProps> = ({ type, showAll = false }) => {
  const navigate = useNavigate()
  const [limit]  = useState(showAll ? 50 : 5)
  const [offset, setOffset]             = useState(0)
  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [uploadingForId, setUploadingForId] = useState<string | null>(null)
  const [uploadError, setUploadError]   = useState('')

  const filters = useMemo(() => ({ type, limit, offset }), [type, limit, offset])
  const { expenses, total, isLoading, deleteExpense, isDeleting, isFetching } = useExpenses(filters)

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this expense?')) deleteExpense(id)
  }

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id))

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Skeleton width="140px" height="20px" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => <ExpenseCardSkeleton key={i} />)}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="No expenses yet"
          desc="Add your first expense to start tracking."
        />
      </div>
    )
  }

  const title = type === 'CASH' ? 'Cash Expenses' : type === 'DIGITAL' ? 'Digital Expenses' : 'Recent Expenses'

  return (
    <>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="section-title">{title}</h3>
          {!showAll && total > limit && (
            <button
              onClick={() => navigate(`/expenses/all${type ? `?type=${type}` : ''}`)}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {expenses.slice(0, showAll ? undefined : 5).map((expense) => (
            <div key={expense.id}>
              {/* Main row */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition"
                onClick={() => toggle(expense.id)}
              >
                {/* Type icon */}
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                  expense.type === 'CASH'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40'
                    : 'bg-blue-50 dark:bg-blue-950/40',
                )}>
                  {expense.type === 'CASH'
                    ? <Banknote  className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    : <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  }
                </span>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {expense.purpose}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                    {expense.location && ` · ${expense.location}`}
                  </p>
                </div>

                {/* Amount + badge + chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={expense.type === 'CASH' ? 'green' : 'blue'}>
                    {expense.type}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {fmt(expense.amount)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-600">
                    {expandedId === expense.id
                      ? <ChevronUp   className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />
                    }
                  </span>
                </div>
              </div>

              {/* Expanded panel */}
              {expandedId === expense.id && (
                <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/30 animate-fade-in">
                  {/* Detail fields */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm mb-3">
                    {expense.description && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</p>
                        <p className="mt-0.5 text-gray-700 dark:text-gray-300">{expense.description}</p>
                      </div>
                    )}
                    {expense.payment_method && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment Method</p>
                        <p className="mt-0.5 text-gray-700 dark:text-gray-300">{expense.payment_method}</p>
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  {expense.media && expense.media.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Attachments</p>
                      <div className="flex flex-wrap gap-2">
                        {expense.media.map((file: MediaFile) => (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400 transition"
                          >
                            <Paperclip className="h-3 w-3" />
                            {file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload section */}
                  {uploadingForId === expense.id && (
                    <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                      {uploadError && (
                        <p className="mb-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                      )}
                      <FileUpload
                        entityId={expense.id}
                        entityType="expense"
                        existingMedia={expense.media || []}
                        maxFiles={5}
                        onError={setUploadError}
                        onFileUpload={() => { setUploadError(''); setUploadingForId(null) }}
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Edit */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(expense.id) }}
                      className="btn-ghost text-xs h-8 px-2.5 text-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-950/40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    {/* Upload receipt */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setUploadError('')
                        setUploadingForId(uploadingForId === expense.id ? null : expense.id)
                      }}
                      className="btn-ghost text-xs h-8 px-2.5"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {uploadingForId === expense.id ? 'Close' : 'Upload Receipt'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(expense.id) }}
                      disabled={isDeleting}
                      className="btn-ghost text-xs h-8 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination (showAll mode) */}
        {showAll && total > limit && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <Button
              variant="secondary" size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <Button
              variant="secondary" size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit Expense"
        size="md"
      >
        {editingId && (
          <ExpenseEditForm
            expenseId={editingId}
            onSuccess={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>
    </>
  )
}
