import React, { useEffect, useState } from 'react'
import {
  Pencil, Check, X, Loader2, TrendingUp, Wallet,
  Plus, Minus,
} from 'lucide-react'
import settingsService, { MonthlyIncome } from '../../services/settingsService'
import { format } from 'date-fns'

const fmt = (v: number) =>
  `₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

type EditMode = 'none' | 'set' | 'add' | 'subtract'

export const IncomeSavingsCard: React.FC = () => {
  const [data, setData]      = useState<MonthlyIncome | null>(null)
  const [isLoading, setLoad] = useState(true)
  const [editMode, setMode]  = useState<EditMode>('none')
  const [inputVal, setInput] = useState('')
  const [saving, setSaving]  = useState(false)
  const [error, setError]    = useState('')

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
    if (!inputVal || isNaN(val) || val < 0) { setError('Enter a valid amount.'); return }
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

  if (isLoading) {
    return (
      <div className="card p-5 space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      </div>
    )
  }

  const hasIncome     = !!data?.month_income
  // Pure numbers — strip lent adjustments so users see simple income vs spending
  const pureExpenses  = (data?.month_expenses ?? 0) - (data?.month_lent_out ?? 0)

  return (
    <div className="card p-5 space-y-4">

      {/* ── This Month header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">This Month</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
            {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>
        {editMode === 'none' && (
          <button
            onClick={() => openMode('set')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950 transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            {hasIncome ? 'Edit Income' : 'Set Income'}
          </button>
        )}
      </div>

      {/* ── Income edit form ──────────────────────────────────────── */}
      {editMode !== 'none' && (
        <div className="space-y-2">
          <label className="label">
            {editMode === 'set' ? "Set this month's income"
              : editMode === 'add' ? 'Add to income'
              : 'Subtract from income'} (₹)
          </label>
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
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={saving}
              className="btn-primary flex items-center gap-1.5 h-9 px-4 text-sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
            <button onClick={cancel} className="btn-ghost h-9 px-4 text-sm flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── This month 3 tiles ────────────────────────────────────── */}
      {editMode === 'none' && (
        <div className="grid grid-cols-2 gap-3">

          {/* Income */}
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div className="flex gap-1">
                <button
                  onClick={() => openMode('add')}
                  title="Add"
                  className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 transition"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => openMode('subtract')}
                  title="Subtract"
                  className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 transition"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">
              {hasIncome ? fmt(data!.month_income) : '—'}
            </p>
          </div>

          {/* Expenses */}
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-3 space-y-1">
            <Wallet className="h-4 w-4 text-red-500 dark:text-red-400" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400 leading-none">
              {fmt(pureExpenses)}
            </p>
          </div>

        </div>
      )}


    </div>
  )
}
