import React, { useState } from 'react'
import { format } from 'date-fns'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'
import { FileUpload } from '../Common/FileUpload'
import { FormField, Input, Select } from '../UI/FormElements'
import { Button } from '../UI/Button'

interface TransactionFormProps {
  onSuccess?: () => void
  type?:      'BORROWED' | 'LENT'
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, type = 'BORROWED' }) => {
  const [transactionType, setTransactionType] = useState<'BORROWED' | 'LENT'>(type)
  const [personName, setPersonName]           = useState('')
  const [amount, setAmount]                   = useState('')
  const [givenDate, setGivenDate]             = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [purpose, setPurpose]                 = useState('')
  const [error, setError]                     = useState('')
  const [createdTransactionId, setCreatedTransactionId] = useState<string | null>(null)

  const { createTransactionAsync, isCreating } = useTransactions()

  // Dynamic labels based on transaction type
  const isBorrowed = transactionType === 'BORROWED'
  const labels = {
    person:      isBorrowed ? 'Who did you borrow from?' : 'Who did you lend to?',
    personHint:  isBorrowed ? 'e.g. Rahul, Bank, Friend' : 'e.g. Priya, Colleague',
    dateGiven:   isBorrowed ? 'Date Borrowed'            : 'Date Lent',
    returnDate:  isBorrowed ? 'When will you return it?' : 'When should they return it?',
    purpose:     isBorrowed ? 'Why did you borrow?'      : 'Why did you lend?',
    submit:      isBorrowed ? 'Record Borrowed'           : 'Record Lent',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!personName || !amount || !givenDate) {
      setError('Please fill in all required fields')
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number')
      return
    }
    if (expectedReturnDate && expectedReturnDate <= givenDate) {
      setError('Return date must be after the transaction date')
      return
    }

    try {
      const transaction = await createTransactionAsync({
        type: transactionType,
        personName,
        amount: numAmount,
        givenDate,
        expectedReturnDate: expectedReturnDate || undefined,
        purpose: purpose || undefined,
      })
      setCreatedTransactionId(transaction.id)
      setPersonName('')
      setAmount('')
      setGivenDate(format(new Date(), 'yyyy-MM-dd'))
      setExpectedReturnDate('')
      setPurpose('')
    } catch (err: any) {
      const msg = err?.message || err?.error_description || err?.response?.data?.message || 'Failed to save transaction'
      setError(msg)
    }
  }

  const finish = () => { setCreatedTransactionId(null); onSuccess?.() }

  return (
    <div className="space-y-5">
      {error && (
        <div className="alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector — only shown when type is not pre-set */}
        {type === undefined && (
          <FormField label="Transaction Type">
            <Select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as 'BORROWED' | 'LENT')}
            >
              <option value="BORROWED">I Borrowed (I need to pay back)</option>
              <option value="LENT">I Lent (They need to pay back)</option>
            </Select>
          </FormField>
        )}

        {/* Person name */}
        <FormField label={labels.person} required>
          <Input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder={labels.personHint}
            required
          />
        </FormField>

        {/* Amount + transaction date */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount (₹)" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </FormField>
          <FormField label={labels.dateGiven} required>
            <Input
              type="date"
              value={givenDate}
              onChange={(e) => setGivenDate(e.target.value)}
              required
            />
          </FormField>
        </div>

        {/* Return date */}
        <FormField label={labels.returnDate} hint="Optional — set a reminder">
          <Input
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
            min={givenDate}
          />
        </FormField>

        {/* Purpose */}
        <FormField label={labels.purpose} hint="Optional">
          <Input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Emergency, Groceries, Travel"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isCreating}
          disabled={!!createdTransactionId}
        >
          {isCreating ? 'Saving…' : labels.submit}
        </Button>
      </form>

      {/* Success — optional proof upload */}
      {createdTransactionId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Saved! Upload a screenshot or proof (optional).
            </p>
          </div>
          <FileUpload
            entityId={createdTransactionId}
            entityType="transaction"
            onFileUpload={finish}
            onError={(err) => setError(err)}
            maxFiles={1}
          />
          <Button variant="secondary" size="sm" fullWidth onClick={finish}>
            Done without upload
          </Button>
        </div>
      )}
    </div>
  )
}
