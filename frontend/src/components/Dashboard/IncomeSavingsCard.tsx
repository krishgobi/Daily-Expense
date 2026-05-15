import React, { useEffect, useState } from 'react'
import { Pencil, Check, X, Loader2, TrendingUp, Wallet, Landmark } from 'lucide-react'
import settingsService, { MonthlyIncome } from '../../services/settingsService'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'

const fmt = (v: number) =>
  `₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const IncomeSavingsCard: React.FC = () => {
  const [data, setData]       = useState<MonthlyIncome | null>(null)
  const [isLoading, setLoad]  = useState(true)
  const [editing, setEditing] = useState(false)
  const [income, setIncome]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = async () => {
    try {
      setLoad(true)
      setData(await settingsService.getMonthlyIncome())
    } catch { /* no data yet */ }
    finally { setLoad(false) }
  }

  useEffect(() => { load() }, [])

  const openEdit = () => {
    setIncome(data?.month_income ? String(data.month_income) : '')
    setError('')
    setEditing(true)
  }

  const cancel = () => { setEditing(false); setError('') }

  const submit = async () => {
    const inc = income ? parseFloat(income) : null
    if (inc !== null && (isNaN(inc) || inc < 0)) { setError('Enter a valid income amount.'); return }
    setSaving(true); setError('')
    try {
      await settingsService.updateMonthlyIncome({ income: inc })
      setEditing(false)
      await load()
    } catch { setError('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  const monthName = format(new Date(), 'MMMM yyyy')

  if (isLoading) {
    return (
      <div className="card p-5 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      </div>
    )
  }

  const balance  = data?.overall_balance ?? 0
  const balColor = balance >= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="section-title">Balance & Income</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{monthName}</p>
        </div>
        {!editing && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950 transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            {data?.month_income ? 'Edit Income' : 'Add Income'}
          </button>
        )}
      </div>

      {/* Overall balance — big number */}
      <div className="mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 px-5 py-4 flex items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/60">
          <Landmark className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </span>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Overall Balance</p>
          <p className={cn('text-2xl font-bold tracking-tight', balColor)}>
            {balance < 0 ? '−' : ''}{fmt(balance)}
          </p>
        </div>
        {data?.initial_balance === 0 && !data?.month_income && (
          <p className="ml-auto text-xs text-gray-400 dark:text-gray-500 text-right max-w-[140px]">
            Set an initial balance in Profile Settings
          </p>
        )}
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="label">
              This month's salary / income (₹)
              <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
            </label>
            <input
              type="number"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder="e.g. 50000"
              className="input"
              min="0"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={saving}
              className="btn-primary flex items-center gap-1.5 h-9 px-4 text-sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
            <button onClick={cancel} className="btn-ghost h-9 px-4 text-sm flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" />Cancel
            </button>
          </div>
        </div>
      ) : (
        /* This month breakdown */
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={<TrendingUp className="h-4 w-4" />}
            label="Income"
            value={data?.month_income ? fmt(data.month_income) : '—'}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-950/40"
          />
          <StatTile
            icon={<Wallet className="h-4 w-4" />}
            label="Expenses"
            value={data?.month_expenses ? fmt(data.month_expenses) : '—'}
            color="text-red-600 dark:text-red-400"
            bg="bg-red-50 dark:bg-red-950/40"
          />
          <StatTile
            icon={<Landmark className="h-4 w-4" />}
            label="Savings"
            value={data?.month_income ? fmt(data.month_savings) : '—'}
            color={
              (data?.month_savings ?? 0) >= 0
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-red-600 dark:text-red-400'
            }
            bg="bg-brand-50 dark:bg-brand-950/40"
          />
        </div>
      )}
    </div>
  )
}

const StatTile: React.FC<{
  icon: React.ReactNode; label: string; value: string; color: string; bg: string
}> = ({ icon, label, value, color, bg }) => (
  <div className={`rounded-xl p-3 ${bg}`}>
    <div className={`mb-1.5 ${color}`}>{icon}</div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`text-sm font-bold ${color}`}>{value}</p>
  </div>
)
