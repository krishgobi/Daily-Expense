import React from 'react'
import { AppShell } from '../components/Layout/AppShell'
import { ReportGenerator } from '../components/Reports/ReportGenerator'
import { ReportList } from '../components/Reports/ReportList'

export const ReportsPage: React.FC = () => (
  <AppShell>
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and download clean summaries of your expenses.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
