import React, { useEffect, useState } from 'react'
import {
  Pencil, Check, X, Loader2, TrendingUp, Wallet, Landmark,
  Plus, Minus, ArrowDownLeft, ArrowUpRight, Receipt,
} from 'lucide-react'
import settingsService, { MonthlyIncome } from '../../services/settingsService'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'

const fmt = (v: number) =>
  `₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

type EditMode = 'none' | 'set' | 'add' | 'subtract'

export const IncomeSavingsCard: React.FC = () => {
  const [data, setData]       = useState<MonthlyIncome | null>(null)
  const [isLoading, setLoad]  = useState(true)
  const [editMode, setMode]   = useState<EditMode>('none')
  const [inputVal, setInput]  = useState('')
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

  const openMode = (mode: EditMode) => {
    setInput(mode === 'set' ? (data?.month_income ? String(data.month_income) : '') : '')
    setError('')
    setMode(mode)
  }

  const cancel = () => { setMode('none'); setError('') }

  const submit = async () => {
    const val = parseFloat(inputVal)
    if (!inputVal || isNaN(val) || val < 0) { setError('Enter a valid positive amount.'); return }
    setSaving(true); setError('')
    try {
      if (editMode === 'set') {
        await settingsService.updateMonthlyIncome({ income: val })
      } else {
        await settingsService.adjustIncome({
          amount:    val,
          operation: editMode === 'add' ? 'add' : 'subtract',
        })
      }
      setMode('none')
      await load()
    } catch { setError('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') cancel()
  }

  const monthName = format(new Date(), 'MMMM yyyy')

  if (isLoading) {
    return (
      <div className="card p-5 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      </div>
    )
  }

  const balance     = data?.overall_balance ?? 0
  const balColor    = balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
  const hasIncome   = !!data?.month_income
  const savColor    = (data?.month_savings ?? 0) >= 0
    ? 'text-brand-600 dark:text-brand-400'
    : 'text-red-600 dark:text-red-400'

  const labelFor: Record<EditMode, string> = {
    none:     '',
    set:      'Set this month\'s income (₹)',
    add:      'Add to this month\'s income (₹)',
    subtract: 'Subtract from this month\'s income (₹)',
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="section-title">Balance & Income</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{monthName}</p>
        </div>
        {editMode === 'none' && (
          <button
            onClick={() => openMode('set')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950 transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            {hasIncome ? 'Edit Income' : 'Add Income'}
          </button>
        )}
      </div>

      {/* Overall balance */}
      <div className="mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 px-5 py-4 flex items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/60">
          <Landmark className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </span>
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Overall Balance</p>
          <p className={cn('text-2xl font-bold tracking-tight', balColor)}>
            {balance < 0 ? '−' : ''}{fmt(balance)}
          </p>
        </div>
        {data?.initial_balance === 0 && !hasIncome && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right max-w-[140px]">
            Set an initial balance in Profile Settings
          </p>
        )}
      </div>

      {/* Calculator / Set form */}
      {editMode !== 'none' ? (
        <div className="space-y-3 mb-4">
          <div className="space-y-1.5">
            <label className="label">{labelFor[editMode]}</label>
            <input
              type="number"
              value={inputVal}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. 5000"
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
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Income tile with +/- buttons */}
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/40 col-span-1">
            <div className="mb-1 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {hasIncome ? fmt(data!.month_income) : '—'}
            </p>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => openMode('add')}
                title="Add to income"
                className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 transition"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={() => openMode('subtract')}
                title="Subtract from income"
                className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 transition"
              >
                <Minus className="h-3 w-3" />
              </button>
            </div>
          </div>

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
            value={hasIncome ? fmt(data!.month_savings) : '—'}
            color={savColor}
            bg="bg-brand-50 dark:bg-brand-950/40"
          />
        </div>
      )}

      {/* Overall & transaction section */}
      {editMode === 'none' && (
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">All time</p>
          <div className="grid grid-cols-3 gap-2">
            <MiniTile
              icon={<Receipt className="h-3.5 w-3.5" />}
              label="Total Expenses"
              value={data?.overall_expenses ? fmt(data.overall_expenses) : '₹0'}
              color="text-orange-600 dark:text-orange-400"
            />
            <MiniTile
              icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              label="Lent (pending)"
              value={data?.lent_pending ? fmt(data.lent_pending) : '₹0'}
              color="text-yellow-600 dark:text-yellow-400"
            />
            <MiniTile
              icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
              label="Borrowed"
              value={data?.borrowed_pending ? fmt(data.borrowed_pending) : '₹0'}
              color="text-sky-600 dark:text-sky-400"
            />
          </div>
          {(data?.month_lent_returned ?? 0) > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 pt-1">
              +{fmt(data!.month_lent_returned)} returned to you this month
            </p>
          )}
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

const MiniTile: React.FC<{
  icon: React.ReactNode; label: string; value: string; color: string
}> = ({ icon, label, value, color }) => (
  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
    <div className={cn('flex items-center gap-1 mb-1', color)}>{icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className={cn('text-sm font-semibold', color)}>{value}</p>
  </div>
)
