import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SpendingTrendChart } from '../components/Charts/SpendingTrendChart'
import { CategoryBreakdownChart } from '../components/Charts/CategoryBreakdownChart'
import { ExpenseTypeChart } from '../components/Charts/ExpenseTypeChart'
import { DailyExpenseChart } from '../components/Charts/DailyExpenseChart'
import { useDashboardOverview, useTopCategories } from '../hooks/useAnalytics'

export const AnalyticsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: overview, isLoading } = useDashboardOverview()
  const { data: topCategories } = useTopCategories(5)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">💰 Smart Expense Manager</h1>
              <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
                Dashboard
              </button>
              <button onClick={() => navigate('/analytics')} className="text-blue-600 font-semibold">
                Analytics
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.full_name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month: {overview?.month}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow rounded-lg p-6">
                  <p className="text-gray-600 text-sm">Today</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    ₹{(overview?.summary.today || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <p className="text-gray-600 text-sm">This Week</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ₹{(overview?.summary.week || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <p className="text-gray-600 text-sm">This Month</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    ₹{(overview?.summary.month || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </section>

            {/* Charts Grid */}
            <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SpendingTrendChart />
              <CategoryBreakdownChart />
            </section>

            <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ExpenseTypeChart />
              <DailyExpenseChart />
            </section>

            {/* Top Categories */}
            {topCategories && topCategories.length > 0 && (
              <section className="mb-8">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Spending Categories (All Time)</h3>
                  <div className="space-y-3">
                    {topCategories.map((cat, idx) => (
                      <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{cat.icon}</span>
                          <div>
                            <p className="font-semibold">{cat.name}</p>
                            <p className="text-sm text-gray-600">{cat.count} expenses</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-blue-600">₹{cat.total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
