import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { AlertCircle, Paperclip } from 'lucide-react'
import expenseService, { Expense, MediaFile } from '../../services/expenseService'
import { useQueryClient } from '@tanstack/react-query'
import { FileUpload } from '../Common/FileUpload'
import { FormField, Input, Textarea, Select } from '../UI/FormElements'
import { Button } from '../UI/Button'

interface ExpenseEditFormProps {
  expenseId:  string
  onSuccess?: () => void
  onCancel?:  () => void
}

export const ExpenseEditForm: React.FC<ExpenseEditFormProps> = ({ expenseId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient()

  const [expenseType, setExpenseType]     = useState<'CASH' | 'DIGITAL'>('CASH')
  const [purpose, setPurpose]             = useState('')
  const [amount, setAmount]               = useState('')
  const [date, setDate]                   = useState(format(new Date(), 'yyyy-MM-dd'))
  const [location, setLocation]           = useState('')
  const [description, setDescription]     = useState('')
  const [paymentMethod, setPaymentMethod] = useState('GPay')
  const [existingMedia, setExistingMedia] = useState<MediaFile[]>([])
  const [showUpload, setShowUpload]       = useState(false)
  const [error, setError]                 = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [loadingData, setLoadingData]     = useState(true)

  // Load expense data on mount
  useEffect(() => {
    setLoadingData(true)
    expenseService.getExpense(expenseId)
      .then((e: Expense) => {
        setExpenseType(e.type as 'CASH' | 'DIGITAL')
        setPurpose(e.purpose)
        setAmount(e.amount.toString())
        // Handle both string dates and Date objects
        const dateStr = typeof e.date === 'string'
          ? e.date.split('T')[0]
          : format(new Date(e.date), 'yyyy-MM-dd')
        setDate(dateStr)
        setLocation(e.location || '')
        setDescription(e.description || '')
        setPaymentMethod(e.payment_method || 'GPay')
        setExistingMedia(e.media || [])
      })
      .catch(() => setError('Failed to load expense details'))
      .finally(() => setLoadingData(false))
  }, [expenseId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!purpose.trim() || !amount || !date) {
      setError('Please fill in all required fields')
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number')
      return
    }

    setIsLoading(true)
    try {
      await expenseService.updateExpense(expenseId, {
        type:           expenseType,
        purpose:        purpose.trim(),
        amount:         numAmount,
        date,
        description:    description.trim() || undefined,
        location:       location.trim()    || undefined,
        payment_method: expenseType === 'DIGITAL' ? paymentMethod : undefined,
      })
      // Invalidate all expense queries so lists refresh
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Failed to update expense')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-11 w-full rounded-xl bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    )
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
        <FormField label="Expense Type">
          <Select value={expenseType} onChange={(e) => setExpenseType(e.target.value as 'CASH' | 'DIGITAL')}>
            <option value="CASH">Cash</option>
            <option value="DIGITAL">Digital</option>
          </Select>
        </FormField>

        <FormField label="Purpose" required>
          <Input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Lunch, Bus fare"
            required
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" required>
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
          <FormField label="Date" required>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </FormField>
        </div>

        <FormField label="Location">
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did you spend?"
          />
        </FormField>

        <FormField label="Notes">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes (optional)"
            rows={2}
          />
        </FormField>

        {expenseType === 'DIGITAL' && (
          <FormField label="Payment Method">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="GPay">Google Pay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="UPI">UPI</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Other">Other</option>
            </Select>
          </FormField>
        )}

        {/* Existing attachments */}
        {existingMedia.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Attached Receipts</p>
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

        {/* Upload toggle */}
        {showUpload && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
            <FileUpload
              entityId={expenseId}
              entityType="expense"
              existingMedia={existingMedia}
              onFileUpload={() => { setShowUpload(false); onSuccess?.() }}
              onError={setError}
              maxFiles={5}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          {expenseType === 'DIGITAL' && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowUpload((v) => !v)}
              title="Upload receipt"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            {isLoading ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
