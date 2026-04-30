import React from 'react'
import { SpendingTrendChart } from '../components/Charts/SpendingTrendChart'
import { ExpenseTypeChart } from '../components/Charts/ExpenseTypeChart'
import { DailyExpenseChart } from '../components/Charts/DailyExpenseChart'
import { useDashboardOverview } from '../hooks/useAnalytics'
import { AppShell } from '../components/Layout/AppShell'

export const AnalyticsPage: React.FC = () => {
  const { data: overview, isLoading } = useDashboardOverview()

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Understand your spending patterns at a glance.
          </p>
        </section>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                This Month: {overview?.month}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    ₹{(overview?.summary.today || 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ₹{(overview?.summary.week || 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    ₹{(overview?.summary.month || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </section>

            {/* Charts Grid */}
            <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <SpendingTrendChart />
              <ExpenseTypeChart />
            </section>

            <section>
              <DailyExpenseChart />
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
