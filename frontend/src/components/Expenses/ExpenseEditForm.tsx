import React, { useState, useEffect } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import { FileUpload } from '../Common/FileUpload'
import { format } from 'date-fns'
import { Expense, MediaFile } from '../../services/expenseService'

interface ExpenseEditFormProps {
  expenseId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export const ExpenseEditForm: React.FC<ExpenseEditFormProps> = ({ 
  expenseId, 
  onSuccess, 
  onCancel 
}) => {
  const [expenseType, setExpenseType] = useState<'CASH' | 'DIGITAL'>('CASH')
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('GPay')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [existingMedia, setExistingMedia] = useState<MediaFile[]>([])

  // Get expense service directly for update
  const expenseService = require('../../services/expenseService').default

  useEffect(() => {
    const loadExpense = async () => {
      try {
        const expense = await expenseService.getExpense(expenseId)
        setExpenseType(expense.type as 'CASH' | 'DIGITAL')
        setPurpose(expense.purpose)
        setAmount(expense.amount.toString())
        setDate(format(new Date(expense.date), 'yyyy-MM-dd'))
        setLocation(expense.location || '')
        setDescription(expense.description || '')
        setPaymentMethod(expense.payment_method || 'GPay')
        setExistingMedia(expense.media || [])
      } catch (err) {
        setError('Failed to load expense details')
      }
    }
    loadExpense()
  }, [expenseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!purpose || !amount || !date) {
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
        purpose,
        amount: numAmount,
        date,
        description: description || undefined,
        location: location || undefined,
      }

      if (expenseType === 'DIGITAL') {
        updateData.payment_method = paymentMethod
      }

      await expenseService.updateExpense(expenseId, updateData)
      
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update expense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUploadSuccess = () => {
    setShowFileUpload(false)
    if (onSuccess) onSuccess()
  }

  const handleTypeChange = (newType: 'CASH' | 'DIGITAL') => {
    setExpenseType(newType)
    // Reset payment method when switching types
    if (newType === 'CASH') {
      setPaymentMethod('GPay')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Edit Expense
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
            Expense Type
          </label>
          <select
            value={expenseType}
            onChange={(e) => handleTypeChange(e.target.value as 'CASH' | 'DIGITAL')}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-300 dark:focus:ring-gray-700"
          >
            <option value="CASH">Cash</option>
            <option value="DIGITAL">Digital</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Purpose *
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Lunch, Gas"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            required
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
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did you spend?"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
          />
        </div>

        {expenseType === 'DIGITAL' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            >
              <option value="GPay">Google Pay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="UPI">UPI</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        {/* Show existing media for digital expenses */}
        {expenseType === 'DIGITAL' && existingMedia.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Attached Receipts:</p>
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
            {isLoading ? 'Updating...' : 'Update Expense'}
          </button>
          
          {expenseType === 'DIGITAL' && (
            <button
              type="button"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="h-11 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              {showFileUpload ? 'Cancel' : '📎 Add Receipt'}
            </button>
          )}
        </div>
      </div>

      {/* File Upload Section for Digital Expenses */}
      {showFileUpload && expenseType === 'DIGITAL' && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
          <p className="mb-3 text-sm font-medium text-blue-700 dark:text-blue-300">
            Upload receipt or screenshot for this digital expense
          </p>
          <FileUpload
            entityId={expenseId}
            entityType="expense"
            existingMedia={existingMedia}
            onFileUpload={handleFileUploadSuccess}
            onError={(err) => setError(err)}
            maxFiles={5}
          />
        </div>
      )}
    </form>
  )
}
