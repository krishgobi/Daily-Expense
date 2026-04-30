import React, { useState } from 'react'
import { useExpenses, useCategories } from '../../hooks/useExpenses'
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
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  const { categories } = useCategories()
  const { createCashExpense, createDigitalExpense, isCreatingCash, isCreatingDigital } = useExpenses()

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
        createCashExpense({
          purpose,
          amount: numAmount,
          date,
          categoryId: categoryId || undefined,
          description: description || undefined,
          location: location || undefined,
        })
      } else {
        createDigitalExpense({
          purpose,
          amount: numAmount,
          paymentMethod,
          date,
          categoryId: categoryId || undefined,
          description: description || undefined,
          location: location || undefined,
        })
      }

      // Reset form
      setPurpose('')
      setAmount('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setLocation('')
      setDescription('')
      setCategoryId('')

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6">
        Add {expenseType === 'CASH' ? 'Cash' : 'Digital'} Expense
      </h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {type === undefined && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Type
          </label>
          <select
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value as 'CASH' | 'DIGITAL')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CASH">Cash</option>
            <option value="DIGITAL">Digital</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose *
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Lunch, Gas"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did you spend?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {expenseType === 'DIGITAL' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
