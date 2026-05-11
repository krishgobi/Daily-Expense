import React, { useState, useEffect } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { format } from 'date-fns'

interface TransactionEditFormProps {
  transactionId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export const TransactionEditForm: React.FC<TransactionEditFormProps> = ({ 
  transactionId, 
  onSuccess, 
  onCancel 
}) => {
  const [transactionType, setTransactionType] = useState<'BORROWED' | 'LENT'>('BORROWED')
  const [personName, setPersonName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState('')
  const [givenDate, setGivenDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [existingMedia, setExistingMedia] = useState<any[]>([])

  const { updateTransaction } = useTransactions()

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        // Get transaction service directly for single transaction
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const transaction = await response.json()
          setTransactionType(transaction.transaction_type)
          setPersonName(transaction.person_name)
          setPurpose(transaction.purpose || '')
          setAmount(transaction.amount.toString())
          setGivenDate(format(new Date(transaction.given_date), 'yyyy-MM-dd'))
          setExpectedReturnDate(transaction.expected_return_date ? format(new Date(transaction.expected_return_date), 'yyyy-MM-dd') : '')
          setExistingMedia(transaction.media || [])
        }
      } catch (err) {
        setError('Failed to load transaction details')
      }
    }
    loadTransaction()
  }, [transactionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!personName || !amount || !givenDate) {
      setError('Please fill in required fields')
      setIsLoading(false)
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number')
      setIsLoading(false)
      return
    }

    try {
      const updateData: any = {
        transaction_type: transactionType,
        person_name: personName,
        purpose: purpose || undefined,
        amount: numAmount,
        given_date: givenDate,
        expected_return_date: expectedReturnDate || undefined,
      }

      await updateTransaction({ id: transactionId, updates: updateData })
      
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update transaction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Edit Transaction
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          ✕
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Transaction Type
          </label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as 'BORROWED' | 'LENT')}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-300 dark:focus:ring-gray-700"
          >
            <option value="BORROWED">Borrowed (Money I Owe)</option>
            <option value="LENT">Lent (Money Owed to Me)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Person Name *
          </label>
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="e.g., John Doe"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Purpose
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Emergency, Business, Personal"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Given Date *
          </label>
          <input
            type="date"
            value={givenDate}
            onChange={(e) => setGivenDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Expected Return Date
          </label>
          <input
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
            min={givenDate}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
          />
        </div>

        {/* Show existing media */}
        {existingMedia.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Attached Proof:</p>
            <div className="space-y-2">
              {existingMedia.map((file) => (
                <div key={file.id} className="flex items-center justify-between text-sm">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    📎 {file.file_name}
                  </a>
                  <span className="text-xs text-gray-500">({file.file_type})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 dark:focus:ring-blue-950"
          >
            {isLoading ? 'Updating...' : 'Update Transaction'}
          </button>
        </div>
      </div>
    </form>
  )
}
