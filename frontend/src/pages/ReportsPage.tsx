import React from 'react'
import { ReportGenerator } from '../components/Reports/ReportGenerator'
import { ReportList } from '../components/Reports/ReportList'
import { AppShell } from '../components/Layout/AppShell'

export const ReportsPage: React.FC = () => {
  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Generate and download clean summaries of your expenses.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ReportGenerator />
          </div>
          <div className="lg:col-span-2">
            <ReportList />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
