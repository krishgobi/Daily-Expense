import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Search, Calendar, Filter, Receipt, ArrowLeftRight } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import { useTransactions } from '../hooks/useTransactions'
import { AppShell } from '../components/Layout/AppShell'
import { Badge } from '../components/UI/Badge'
import { EmptyState } from '../components/UI/EmptyState'
import { Input } from '../components/UI/FormElements'
import { cn } from '../lib/utils'

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const SearchPage: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'text' | 'date'>('text')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')

  const { expenses }     = useExpenses()
  const { transactions } = useTransactions()

  const filteredExpenses = expenses.filter((e) => {
    if (searchMode === 'text') {
      const q = searchQuery.toLowerCase()
      return (
        e.purpose.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.amount.toString().includes(q)
      )
    }
    const d = new Date(e.date)
    if (dateFrom && d < new Date(dateFrom)) return false
    if (dateTo   && d > new Date(dateTo))   return false
    return true
  })

  const filteredTransactions = transactions.filter((t) => {
    if (searchMode === 'text') {
      const q = searchQuery.toLowerCase()
      return (
        t.person_name.toLowerCase().includes(q) ||
        t.purpose?.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      )
    }
    const d = new Date(t.given_date)
    if (dateFrom && d < new Date(dateFrom)) return false
    if (dateTo   && d > new Date(dateTo))   return false
    return true
  })

  const setQuickRange = (months: number) => {
    setDateFrom(format(subMonths(new Date(), months), 'yyyy-MM-dd'))
    setDateTo(format(new Date(), 'yyyy-MM-dd'))
  }

  const hasResults = filteredExpenses.length > 0 || filteredTransactions.length > 0
  const hasQuery   = searchMode === 'text' ? searchQuery.length > 0 : !!(dateFrom || dateTo)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="page-title">Search</h1>
          <p className="page-subtitle">Find expenses and transactions quickly.</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit dark:border-gray-700 dark:bg-gray-800">
          {[
            { id: 'text' as const, label: 'Text Search', icon: Search },
            { id: 'date' as const, label: 'Date Range',  icon: Calendar },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSearchMode(id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                searchMode === id
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search controls */}
        <div className="card p-5">
          {searchMode === 'text' ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by purpose, description, location, or amount…"
                className="input pl-10"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick presets */}
              <div>
                <p className="label mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'This Month',    action: () => { setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd')); setDateTo(format(endOfMonth(new Date()), 'yyyy-MM-dd')) } },
                    { label: 'Last Month',    action: () => { const lm = subMonths(new Date(), 1); setDateFrom(format(startOfMonth(lm), 'yyyy-MM-dd')); setDateTo(format(endOfMonth(lm), 'yyyy-MM-dd')) } },
                    { label: 'Last 3 Months', action: () => setQuickRange(3) },
                    { label: 'Last 6 Months', action: () => setQuickRange(6) },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date inputs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label mb-1.5">From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label mb-1.5">To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {hasQuery && (
          <div className="space-y-6">
            {/* Expenses */}
            {filteredExpenses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="section-title">Expenses</h2>
                  <Badge variant="gray">{filteredExpenses.length}</Badge>
                </div>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="table-header">
                        <tr>
                          <th className="table-th">Date</th>
                          <th className="table-th">Purpose</th>
                          <th className="table-th">Type</th>
                          <th className="table-th text-right">Amount</th>
                          <th className="table-th hidden sm:table-cell">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((e) => (
                          <tr key={e.id} className="table-row">
                            <td className="table-td text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {format(new Date(e.date), 'MMM d, yyyy')}
                            </td>
                            <td className="table-td font-medium text-gray-900 dark:text-gray-100">
                              {e.purpose}
                            </td>
                            <td className="table-td">
                              <Badge variant={e.type === 'CASH' ? 'green' : 'blue'}>{e.type}</Badge>
                            </td>
                            <td className="table-td text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {fmt(e.amount)}
                            </td>
                            <td className="table-td hidden sm:table-cell text-gray-500 dark:text-gray-400">
                              {e.location || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions */}
            {filteredTransactions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="section-title">Transactions</h2>
                  <Badge variant="gray">{filteredTransactions.length}</Badge>
                </div>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="table-header">
                        <tr>
                          <th className="table-th">Person</th>
                          <th className="table-th hidden sm:table-cell">Purpose</th>
                          <th className="table-th">Type</th>
                          <th className="table-th text-right">Amount</th>
                          <th className="table-th hidden md:table-cell">Date</th>
                          <th className="table-th">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t) => (
                          <tr key={t.id} className="table-row">
                            <td className="table-td font-medium text-gray-900 dark:text-gray-100">
                              {t.person_name}
                            </td>
                            <td className="table-td hidden sm:table-cell text-gray-500 dark:text-gray-400">
                              {t.purpose || '—'}
                            </td>
                            <td className="table-td">
                              <Badge variant={t.transaction_type === 'BORROWED' ? 'red' : 'green'}>
                                {t.transaction_type}
                              </Badge>
                            </td>
                            <td className="table-td text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {fmt(t.amount)}
                            </td>
                            <td className="table-td hidden md:table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {format(new Date(t.given_date), 'MMM d, yyyy')}
                            </td>
                            <td className="table-td">
                              <Badge variant={t.status === 'PENDING' ? 'yellow' : 'green'} dot>
                                {t.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* No results */}
            {!hasResults && (
              <div className="card">
                <EmptyState
                  icon={<Filter className="h-6 w-6" />}
                  title="No results found"
                  desc="Try adjusting your search criteria."
                />
              </div>
            )}
          </div>
        )}

        {/* Initial empty state */}
        {!hasQuery && (
          <div className="card">
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="Start searching"
              desc={searchMode === 'text' ? 'Type something to search your expenses and transactions.' : 'Select a date range to filter results.'}
            />
          </div>
        )}
      </div>
    </AppShell>
  )
}
