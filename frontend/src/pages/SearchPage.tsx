import React, { useState } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { useTransactions } from '../hooks/useTransactions'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Search, Calendar, Filter } from 'lucide-react'

export const SearchPage: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'date' | 'text'>('text')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  const { expenses } = useExpenses()
  const { transactions } = useTransactions()

  // Filter expenses based on search mode
  const filteredExpenses = expenses.filter(expense => {
    if (searchMode === 'text') {
      const query = searchQuery.toLowerCase()
      return (
        expense.purpose.toLowerCase().includes(query) ||
        expense.description?.toLowerCase().includes(query) ||
        expense.location?.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query)
      )
    } else if (searchMode === 'date') {
      const expenseDate = new Date(expense.date)
      const fromDate = dateFrom ? new Date(dateFrom) : null
      const toDate = dateTo ? new Date(dateTo) : null
      
      if (fromDate && expenseDate < fromDate) return false
      if (toDate && expenseDate > toDate) return false
      return true
    }
    return true
  })

  // Filter transactions based on search mode
  const filteredTransactions = transactions.filter(transaction => {
    if (searchMode === 'text') {
      const query = searchQuery.toLowerCase()
      return (
        transaction.person_name.toLowerCase().includes(query) ||
        transaction.purpose?.toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query)
      )
    } else if (searchMode === 'date') {
      const transactionDate = new Date(transaction.given_date)
      const fromDate = dateFrom ? new Date(dateFrom) : null
      const toDate = dateTo ? new Date(dateTo) : null
      
      if (fromDate && transactionDate < fromDate) return false
      if (toDate && transactionDate > toDate) return false
      return true
    }
    return true
  })

  // Quick date presets
  const setQuickDateRange = (months: number) => {
    const endDate = new Date()
    const startDate = subMonths(endDate, months)
    setDateFrom(format(startDate, 'yyyy-MM-dd'))
    setDateTo(format(endDate, 'yyyy-MM-dd'))
  }

  const setThisMonth = () => {
    const now = new Date()
    setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
    setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
  }

  const setLastMonth = () => {
    const now = new Date()
    const lastMonth = subMonths(now, 1)
    setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
    setDateTo(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Search Expenses & Transactions
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Find your expenses and transactions quickly
        </p>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
        <button
          onClick={() => setSearchMode('text')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            searchMode === 'text'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          <Search className="h-4 w-4" />
          Text Search
        </button>
        <button
          onClick={() => setSearchMode('date')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
            searchMode === 'date'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Date Search
        </button>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-700">
        {searchMode === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by purpose, description, location, or amount..."
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Date Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={setThisMonth}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  This Month
                </button>
                <button
                  onClick={setLastMonth}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Last Month
                </button>
                <button
                  onClick={() => setQuickDateRange(3)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Last 3 Months
                </button>
                <button
                  onClick={() => setQuickDateRange(6)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Last 6 Months
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Expenses Results */}
        {filteredExpenses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Expenses ({filteredExpenses.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:bg-gray-900 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {expense.purpose}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              expense.type === 'CASH'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {expense.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{expense.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {expense.location || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Results */}
        {filteredTransactions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Transactions ({filteredTransactions.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:bg-gray-900 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Person
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Given Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {transaction.person_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {transaction.purpose || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.transaction_type === 'BORROWED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {transaction.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {format(new Date(transaction.given_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredExpenses.length === 0 && filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
