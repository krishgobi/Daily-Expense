import React, { useState } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { format } from 'date-fns'

interface TransactionFormProps {
  onSuccess?: () => void
  type?: 'BORROWED' | 'LENT'
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, type = 'BORROWED' }) => {
  const [transactionType, setTransactionType] = useState<'BORROWED' | 'LENT'>(type)
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [givenDate, setGivenDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [purpose, setPurpose] = useState('')
  const [error, setError] = useState('')

  const { createTransaction, isCreating } = useTransactions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!personName || !amount || !givenDate) {
      setError('Please fill in required fields')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number')
      return
    }

    if (expectedReturnDate && expectedReturnDate <= givenDate) {
      setError('Return date must be after given date')
      return
    }

    try {
      createTransaction({
        type: transactionType,
        personName,
        amount: numAmount,
        givenDate,
        expectedReturnDate: expectedReturnDate || undefined,
        purpose: purpose || undefined,
      })

      // Reset form
      setPersonName('')
      setAmount('')
      setGivenDate(format(new Date(), 'yyyy-MM-dd'))
      setExpectedReturnDate('')
      setPurpose('')

      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transaction')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6">
        {transactionType === 'BORROWED' ? 'I Borrowed Money' : 'I Lent Money'}
      </h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {type === undefined && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type
          </label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as 'BORROWED' | 'LENT')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BORROWED">Borrowed (I need to pay)</option>
            <option value="LENT">Lent (They need to pay)</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Person Name *
          </label>
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Who did you borrow from/lend to?"
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
            Date Given *
          </label>
          <input
            type="date"
            value={givenDate}
            onChange={(e) => setGivenDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Return Date
          </label>
          <input
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Why did you borrow/lend?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Add Transaction'}
        </button>
      </div>
    </form>
  )
}
