import React from 'react'
import { AppShell } from '../components/Layout/AppShell'
import { AnalyticsDashboard } from '../components/Analytics/AnalyticsDashboard'

export const AnalyticsPage: React.FC = () => (
  <AppShell>
    <AnalyticsDashboard />
  </AppShell>
)
