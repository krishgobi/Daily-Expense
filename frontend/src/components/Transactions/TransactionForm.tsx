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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!personName || !amount || !givenDate) { setError('Please fill in required fields'); return }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) { setError('Amount must be a positive number'); return }
    if (expectedReturnDate && expectedReturnDate <= givenDate) { setError('Return date must be after given date'); return }

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
      setPersonName(''); setAmount(''); setGivenDate(format(new Date(), 'yyyy-MM-dd')); setExpectedReturnDate(''); setPurpose('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transaction')
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
        {type === undefined && (
          <FormField label="Transaction Type">
            <Select value={transactionType} onChange={(e) => setTransactionType(e.target.value as 'BORROWED' | 'LENT')}>
              <option value="BORROWED">Borrowed (I need to pay back)</option>
              <option value="LENT">Lent (They need to pay back)</option>
            </Select>
          </FormField>
        )}

        <FormField label="Person Name" required>
          <Input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Who did you borrow from / lend to?"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" required>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </FormField>
          <FormField label="Date Given" required>
            <Input
              type="date"
              value={givenDate}
              onChange={(e) => setGivenDate(e.target.value)}
              required
            />
          </FormField>
        </div>

        <FormField label="Expected Return Date" hint="Optional">
          <Input
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </FormField>

        <FormField label="Purpose" hint="Optional">
          <Input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Why did you borrow / lend?"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isCreating}
          disabled={!!createdTransactionId}
        >
          {isCreating ? 'Saving…' : 'Add Transaction'}
        </Button>
      </form>

      {createdTransactionId && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Transaction saved. Upload proof (optional).
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
