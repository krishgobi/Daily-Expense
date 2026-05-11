import React, { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import { FileUpload } from '../Common/FileUpload'
import { format } from 'date-fns'

interface ExpenseFormProps {
  onSuccess?: () => void
  type?: 'CASH' | 'DIGITAL'
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, type = 'CASH' }) => {
  const [expenseType, setExpenseType] = useState<'CASH' | 'DIGITAL'>(type)
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('GPay')
  const [error, setError] = useState('')
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null)

  const {
    createCashExpenseAsync,
    createDigitalExpenseAsync,
    isCreatingCash,
    isCreatingDigital,
  } = useExpenses()

  const isLoading = isCreatingCash || isCreatingDigital

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!purpose || !amount || !date) {
      setError('Please fill in required fields')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number')
      return
    }

    try {
      if (expenseType === 'CASH') {
        const expense = await createCashExpenseAsync({
          purpose,
          amount: numAmount,
          date,
          description: description || undefined,
          location: location || undefined,
        })
        // Capture expense ID for file upload
        if (expense?.id) {
          setCreatedExpenseId(expense.id)
        }
      } else {
        const expense = await createDigitalExpenseAsync({
          purpose,
          amount: numAmount,
          paymentMethod,
          date,
          description: description || undefined,
          location: location || undefined,
        })
        // Capture expense ID for file upload
        if (expense?.id) {
          setCreatedExpenseId(expense.id)
        }
      }

      // Reset form
      setPurpose('')
      setAmount('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setLocation('')
      setDescription('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense')
    }
  }

  const handleFileUploadSuccess = () => {
    // After file upload, close the form
    setCreatedExpenseId(null)
    if (onSuccess) onSuccess()
  }

  const finishWithoutUpload = () => {
    setCreatedExpenseId(null)
    if (onSuccess) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Add {expenseType === 'CASH' ? 'Cash' : 'Digital'} Expense
      </h2>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

      {type === undefined && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Expense Type
          </label>
          <select
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value as 'CASH' | 'DIGITAL')}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-300 dark:focus:ring-gray-700"
          >
            <option value="CASH">Cash</option>
            <option value="DIGITAL">Digital</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
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

        <button
          type="submit"
          disabled={isLoading || !!createdExpenseId}
          className="h-11 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 dark:focus:ring-blue-950"
        >
          {isLoading ? 'Adding...' : 'Add Expense'}
        </button>
      </div>

      {/* File Upload Section - Show after expense created */}
      {createdExpenseId && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/40">
          <p className="mb-3 text-sm font-medium text-green-700 dark:text-green-300">
            Expense saved. Screenshot or receipt upload is optional.
          </p>
          <FileUpload
            entityId={createdExpenseId}
            entityType="expense"
            onFileUpload={handleFileUploadSuccess}
            onError={(err) => setError(err)}
            maxFiles={5}
          />
          <button
            type="button"
            onClick={finishWithoutUpload}
            className="mt-3 h-10 w-full rounded-xl border border-green-300 bg-white px-4 text-sm font-semibold text-green-800 transition hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200 dark:hover:bg-green-950/60"
          >
            Done without upload
          </button>
        </div>
      )}
    </form>
  )
}
