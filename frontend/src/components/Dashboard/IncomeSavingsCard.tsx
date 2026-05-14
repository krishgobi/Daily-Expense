import React, { useEffect, useState } from 'react'
import { Pencil, Check, X, Loader2, TrendingUp, Wallet, PiggyBank } from 'lucide-react'
import settingsService, { MonthlyIncome } from '../../services/settingsService'
import { format } from 'date-fns'

const fmt = (v: number) =>
  `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const IncomeSavingsCard: React.FC = () => {
  const [data, setData]         = useState<MonthlyIncome | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [editing, setEditing]   = useState(false)
  const [income, setIncome]     = useState('')
  const [savings, setSavings]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const d = await settingsService.getMonthlyIncome()
      setData(d)
    } catch {
      // no data yet is fine
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = () => {
    setIncome(data?.income ? String(data.income) : '')
    setSavings(data?.savings && data.savings !== data.income - data.expenses ? String(data.savings) : '')
    setError('')
    setEditing(true)
  }

  const cancel = () => { setEditing(false); setError('') }

  const submit = async () => {
    const inc = parseFloat(income)
    if (!income || isNaN(inc) || inc < 0) { setError('Enter a valid income amount.'); return }
    setSaving(true)
    setError('')
    try {
      await settingsService.updateMonthlyIncome({
        income: inc,
        savings: savings ? parseFloat(savings) || null : null,
      })
      setEditing(false)
      await load()
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const monthName = format(new Date(), 'MMMM yyyy')

  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="section-title">Income & Savings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{monthName}</p>
        </div>
        {!editing && (
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950 transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            {data?.income ? 'Edit' : 'Add Income'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="label">Monthly Income (₹)</label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 50000"
              className="input"
              min="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label">
              Savings Target (₹)
              <span className="ml-1 text-xs font-normal text-gray-400">optional — auto-calculates if blank</span>
            </label>
            <input
              type="number"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              placeholder="e.g. 15000"
              className="input"
              min="0"
            />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 h-9 px-4 text-sm"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
            <button onClick={cancel} className="btn-ghost h-9 px-4 text-sm flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={<TrendingUp className="h-4 w-4" />}
            label="Income"
            value={data?.income ? fmt(data.income) : '—'}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-950/40"
          />
          <StatTile
            icon={<Wallet className="h-4 w-4" />}
            label="Expenses"
            value={data?.expenses != null ? fmt(data.expenses) : '—'}
            color="text-red-600 dark:text-red-400"
            bg="bg-red-50 dark:bg-red-950/40"
          />
          <StatTile
            icon={<PiggyBank className="h-4 w-4" />}
            label="Savings"
            value={data?.savings != null ? fmt(data.savings) : '—'}
            color="text-brand-600 dark:text-brand-400"
            bg="bg-brand-50 dark:bg-brand-950/40"
          />
        </div>
      )}

      {!editing && !data?.income && (
        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          Add your monthly income to see savings tracking
        </p>
      )}
    </div>
  )
}

const StatTile: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bg: string
}> = ({ icon, label, value, color, bg }) => (
  <div className={`rounded-xl p-3 ${bg}`}>
    <div className={`mb-1.5 ${color}`}>{icon}</div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`text-base font-bold ${color}`}>{value}</p>
  </div>
)
