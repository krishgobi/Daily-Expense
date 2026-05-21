import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import {
  ChevronDown, ChevronUp, Edit2, Trash2, CheckCircle2, RotateCcw,
  Paperclip, ArrowRight, ArrowDownLeft, ArrowUpRight, Users,
  AlertTriangle,
} from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'
import { FileUpload } from '../Common/FileUpload'
import { TransactionEditForm } from './TransactionEditForm'
import { Badge } from '../UI/Badge'
import { Button } from '../UI/Button'
import { EmptyState } from '../UI/EmptyState'
import { Modal } from '../UI/Modal'
import { cn } from '../../lib/utils'

interface TransactionListProps {
  type?:    'BORROWED' | 'LENT'
  status?:  'PENDING' | 'COMPLETED'
  showAll?: boolean
}

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const TransactionList: React.FC<TransactionListProps> = ({ type, status, showAll = false }) => {
  const navigate = useNavigate()
  const [limit]  = useState(showAll ? 50 : 5)
  const [offset, setOffset] = useState(0)
  const [uploadingForId, setUploadingForId]   = useState<string | null>(null)
  const [uploadError, setUploadError]         = useState('')
  const [expandedIds, setExpandedIds]         = useState<Set<string>>(new Set())
  const [editingId, setEditingId]             = useState<string | null>(null)

  const { transactions, total, isLoading, completeTransaction, isCompleting, reopenTransaction, isReopening, deleteTransaction } =
    useTransactions({ type, status, limit, offset })

  const getOverdueDays = (t: any) => {
    if (!t.expected_return_date) return null
    const d = differenceInDays(new Date(), new Date(t.expected_return_date))
    return d > 0 ? d : null
  }

  const handleComplete = (id: string) =>
    completeTransaction({ id, actualReturnDate: format(new Date(), 'yyyy-MM-dd') })

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this transaction?')) deleteTransaction(id)
  }

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleShowAll = () => {
    const q = new URLSearchParams()
    if (type)   q.set('type', type)
    if (status) q.set('status', status)
    navigate(`/transactions/all?${q.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-5 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 animate-pulse">
            <div className="h-8 w-8 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No transactions found"
          desc="Record money you've borrowed or lent."
        />
      </div>
    )
  }

  const title = type === 'BORROWED' ? 'Money I Borrowed' : type === 'LENT' ? 'Money I Lent' : 'Transactions'

  return (
    <>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="section-title">{title}</h3>
          {!showAll && total > limit && (
            <button
              onClick={handleShowAll}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {transactions.map((t) => {
            const overdueDays = getOverdueDays(t)
            const isOverdue   = !!overdueDays
            const isPending   = t.status === 'PENDING'
            const expanded    = expandedIds.has(t.id)

            return (
              <div key={t.id}>
                {/* Main row */}
                <div
                  className={cn(
                    'flex items-center gap-3 px-5 py-3.5 cursor-pointer transition',
                    isOverdue
                      ? 'hover:bg-red-50/40 dark:hover:bg-red-950/20'
                      : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/40',
                  )}
                  onClick={() => toggleExpand(t.id)}
                >
                  {/* Icon */}
                  <span className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                    t.transaction_type === 'BORROWED'
                      ? 'bg-red-50 dark:bg-red-950/40'
                      : 'bg-emerald-50 dark:bg-emerald-950/40',
                  )}>
                    {t.transaction_type === 'BORROWED'
                      ? <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                      : <ArrowUpRight  className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    }
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {t.person_name}
                      </p>
                      {isOverdue && (
                        <span className="flex items-center gap-0.5 text-2xs font-semibold text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          {overdueDays}d
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {t.purpose || 'No purpose'} · {format(new Date(t.given_date), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={isPending ? 'yellow' : 'green'} dot>
                      {t.status}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {fmt(t.amount)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-600">
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </div>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/30 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Given on</p>
                        <p className="mt-0.5 text-gray-700 dark:text-gray-300">
                          {format(new Date(t.given_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {t.expected_return_date && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Expected return</p>
                          <p className={cn('mt-0.5', isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300')}>
                            {format(new Date(t.expected_return_date), 'MMM d, yyyy')}
                            {isOverdue && ` (${overdueDays}d overdue)`}
                          </p>
                        </div>
                      )}
                      {t.actual_return_date && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Completed on</p>
                          <p className="mt-0.5 text-gray-700 dark:text-gray-300">
                            {format(new Date(t.actual_return_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Attachments */}
                    {t.media && t.media.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Proof</p>
                        <div className="flex flex-wrap gap-2">
                          {t.media.map((f: any) => (
                            <a
                              key={f.id}
                              href={f.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400 transition"
                            >
                              <Paperclip className="h-3 w-3" />
                              {f.file_name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload */}
                    {uploadingForId === t.id && (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                        {uploadError && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
                        <FileUpload
                          entityId={t.id}
                          entityType="transaction"
                          existingMedia={t.media || []}
                          maxFiles={5}
                          onError={setUploadError}
                          onFileUpload={() => { setUploadError(''); setUploadingForId(null) }}
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadError(''); setUploadingForId(uploadingForId === t.id ? null : t.id) }}
                        className="btn-ghost text-xs h-8 px-2.5"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {uploadingForId === t.id ? 'Close' : 'Upload Proof'}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(t.id) }}
                        className="btn-ghost text-xs h-8 px-2.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      {isPending ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleComplete(t.id) }}
                            disabled={isCompleting}
                            className="btn-ghost text-xs h-8 px-2.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isCompleting ? 'Marking…' : 'Mark Complete'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(t.id) }}
                            className="btn-ghost text-xs h-8 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); reopenTransaction(t.id) }}
                          disabled={isReopening}
                          className="btn-ghost text-xs h-8 px-2.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {isReopening ? 'Reopening…' : 'Mark as Pending'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {showAll && total > limit && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <Button variant="secondary" size="sm" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
              Previous
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}>
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Transaction" size="md">
        {editingId && (
          <TransactionEditForm
            transactionId={editingId}
            onSuccess={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>
    </>
  )
}
