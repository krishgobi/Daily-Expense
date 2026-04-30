import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch, useRecentSearches } from '../hooks/useSearch'
import { AppShell } from '../components/Layout/AppShell'

export const SearchPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'expenses' | 'transactions'>('all')

  const { expenses, transactions, isLoading } = useGlobalSearch(searchQuery)
  const { recent: recentSearches } = useRecentSearches(5)

  const handleRecentSearch = (text: string) => {
    setSearchQuery(text)
  }

  const handleNavigateToTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`)
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            Search
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Find expenses and transactions quickly.
          </p>
        </section>

        {/* Search Box */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Search</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses or transactions..."
              className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-300 dark:focus:ring-gray-700"
            />
          </div>

          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((recent, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearch(recent.text)}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {recent.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {searchQuery && (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'all'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }`}
                >
                  All ({expenses.length + transactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'expenses'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }`}
                >
                  Expenses ({expenses.length})
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex-1 py-3 px-4 text-center font-medium ${
                    activeTab === 'transactions'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }`}
                >
                  Transactions ({transactions.length})
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Searching...</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && (activeTab === 'all' || activeTab === 'expenses') && expenses.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Expenses</h3>
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{expense.purpose}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{expense.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {expense.type}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{expense.date}</span>
                          {expense.location && <span className="text-xs text-gray-500 dark:text-gray-400">📍 {expense.location}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">₹{expense.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && (activeTab === 'all' || activeTab === 'transactions') && transactions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Transactions</h3>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleNavigateToTransaction(transaction.id)}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{transaction.person_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.purpose}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            transaction.type === 'BORROWED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            transaction.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.status}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{transaction.given_date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">₹{transaction.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && expenses.length === 0 && transactions.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <p className="text-lg text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
              </div>
            )}
          </>
        )}

        {!searchQuery && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-lg text-gray-600 dark:text-gray-400">Enter a search query to get started</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
