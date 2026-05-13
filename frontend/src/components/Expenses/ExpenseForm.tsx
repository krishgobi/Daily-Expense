import React, { useState } from 'react'
import { format } from 'date-fns'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { FileUpload } from '../Common/FileUpload'
import { FormField, Input, Textarea, Select } from '../UI/FormElements'
import { Button } from '../UI/Button'

interface ExpenseFormProps {
  onSuccess?: () => void
  type?:      'CASH' | 'DIGITAL'
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, type = 'CASH' }) => {
  const [expenseType, setExpenseType]   = useState<'CASH' | 'DIGITAL'>(type)
  const [purpose, setPurpose]           = useState('')
  const [amount, setAmount]             = useState('')
  const [date, setDate]                 = useState(format(new Date(), 'yyyy-MM-dd'))
  const [location, setLocation]         = useState('')
  const [description, setDescription]   = useState('')
  const [paymentMethod, setPaymentMethod] = useState('GPay')
  const [error, setError]               = useState('')
  const [createdExpenseId, setCreatedExpenseId] = useState<string | null>(null)

  const { createCashExpenseAsync, createDigitalExpenseAsync, isCreatingCash, isCreatingDigital } = useExpenses()
  const isLoading = isCreatingCash || isCreatingDigital

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!purpose || !amount || !date) { setError('Please fill in required fields'); return }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) { setError('Amount must be a positive number'); return }

    try {
      if (expenseType === 'CASH') {
        const expense = await createCashExpenseAsync({ purpose, amount: numAmount, date, description: description || undefined, location: location || undefined })
        if (expense?.id) setCreatedExpenseId(expense.id)
      } else {
        const expense = await createDigitalExpenseAsync({ purpose, amount: numAmount, paymentMethod, date, description: description || undefined, location: location || undefined })
        if (expense?.id) setCreatedExpenseId(expense.id)
      }
      setPurpose(''); setAmount(''); setDate(format(new Date(), 'yyyy-MM-dd')); setLocation(''); setDescription('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense')
    }
  }

  const finish = () => { setCreatedExpenseId(null); onSuccess?.() }

  return (
    <div className="space-y-5">
      {error && (
        <div className="alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector (only when type not pre-set) */}
        {type === undefined && (
          <FormField label="Expense Type">
            <Select value={expenseType} onChange={(e) => setExpenseType(e.target.value as 'CASH' | 'DIGITAL')}>
              <option value="CASH">Cash</option>
              <option value="DIGITAL">Digital</option>
            </Select>
          </FormField>
        )}

        <FormField label="Purpose" required>
          <Input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Lunch, Groceries"
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

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={!!createdExpenseId}
        >
          {isLoading ? 'Saving…' : 'Add Expense'}
        </Button>
      </form>

      {/* Post-save: file upload */}
      {createdExpenseId && expenseType === 'DIGITAL' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Expense saved. Upload a screenshot or receipt for verification.
            </p>
          </div>
          <FileUpload
            entityId={createdExpenseId}
            entityType="expense"
            onFileUpload={finish}
            onError={(err) => setError(err)}
            maxFiles={5}
          />
          <Button variant="secondary" size="sm" fullWidth onClick={finish}>
            Done without upload
          </Button>
        </div>
      )}

      {createdExpenseId && expenseType === 'CASH' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Cash expense saved successfully.
            </p>
          </div>
          <Button variant="secondary" size="sm" fullWidth onClick={finish}>
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
