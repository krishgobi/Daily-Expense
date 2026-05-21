import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertCircle, Paperclip } from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'
import transactionService from '../../services/transactionService'
import { FormField, Input, Select } from '../UI/FormElements'
import { Button } from '../UI/Button'

interface TransactionEditFormProps {
  transactionId: string
  onSuccess?:    () => void
  onCancel?:     () => void
}

export const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transactionId,
  onSuccess,
  onCancel,
}) => {
  const [transactionType, setTransactionType] = useState<'BORROWED' | 'LENT'>('BORROWED')
  const [status, setStatus]                   = useState<'PENDING' | 'COMPLETED'>('PENDING')
  const [personName, setPersonName]           = useState('')
  const [purpose, setPurpose]                 = useState('')
  const [amount, setAmount]                   = useState('')
  const [givenDate, setGivenDate]             = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [actualReturnDate, setActualReturnDate]     = useState('')
  const [existingMedia, setExistingMedia]     = useState<any[]>([])
  const [error, setError]                     = useState('')
  const [isLoading, setIsLoading]             = useState(false)

  const { updateTransaction } = useTransactions()

  useEffect(() => {
    const load = async () => {
      try {
        const t = await transactionService.getTransaction(transactionId)
        setTransactionType(t.transaction_type)
        setStatus(t.status as 'PENDING' | 'COMPLETED')
        setPersonName(t.person_name)
        setPurpose(t.purpose || '')
        setAmount(t.amount.toString())
        setGivenDate(format(new Date(t.given_date), 'yyyy-MM-dd'))
        setExpectedReturnDate(t.expected_return_date ? format(new Date(t.expected_return_date), 'yyyy-MM-dd') : '')
        setActualReturnDate(t.actual_return_date ? format(new Date(t.actual_return_date), 'yyyy-MM-dd') : '')
        setExistingMedia(t.media || [])
      } catch {
        setError('Failed to load transaction details')
      }
    }
    load()
  }, [transactionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!personName || !amount || !givenDate) { setError('Please fill in required fields'); return }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) { setError('Amount must be a positive number'); return }

    setIsLoading(true)
    try {
      updateTransaction({
        id: transactionId,
        updates: {
          transaction_type: transactionType,
          person_name: personName,
          purpose: purpose || undefined,
          amount: numAmount,
          given_date: givenDate,
          expected_return_date: expectedReturnDate || undefined,
          ...(status === 'COMPLETED' && { actual_return_date: actualReturnDate || undefined }),
        },
      })
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update transaction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Transaction Type">
          <Select value={transactionType} onChange={(e) => setTransactionType(e.target.value as any)}>
            <option value="BORROWED">Borrowed (Money I Owe)</option>
            <option value="LENT">Lent (Money Owed to Me)</option>
          </Select>
        </FormField>

        <FormField label="Person Name" required>
          <Input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="e.g. John Doe"
            required
          />
        </FormField>

        <FormField label="Purpose">
          <Input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Emergency, Business"
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
          <FormField label="Given Date" required>
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
            min={givenDate}
          />
        </FormField>

        {status === 'COMPLETED' && (
          <FormField label="Actual Return Date">
            <Input
              type="date"
              value={actualReturnDate}
              onChange={(e) => setActualReturnDate(e.target.value)}
              min={givenDate}
            />
          </FormField>
        )}

        {/* Existing attachments */}
        {existingMedia.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Attached Proof</p>
            <div className="flex flex-wrap gap-2">
              {existingMedia.map((f) => (
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

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            {isLoading ? 'Updating…' : 'Update Transaction'}
          </Button>
        </div>
      </form>
    </div>
  )
}
