import React, { useState } from 'react'
import { format } from 'date-fns'
import { Download, Trash2, BarChart3 } from 'lucide-react'
import { useReports } from '../../hooks/useReports'
import { Badge } from '../UI/Badge'
import { Button } from '../UI/Button'
import { EmptyState } from '../UI/EmptyState'

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const typeVariant: Record<string, 'blue' | 'green' | 'purple'> = {
  MONTHLY:   'blue',
  QUARTERLY: 'green',
  YEARLY:    'purple',
}

export const ReportList: React.FC = () => {
  const [limit]  = useState(10)
  const [offset, setOffset] = useState(0)

  const { reports, total, isLoading, downloadReport, isDownloading, deleteReport } = useReports(limit, offset)

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this report?')) deleteReport(id)
  }

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div className="ml-auto h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No reports yet"
          desc="Generate your first report using the form."
        />
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="section-title">Generated Reports</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80 dark:bg-gray-800/60">
            <tr>
              <th className="table-th">Period</th>
              <th className="table-th">Type</th>
              <th className="table-th">Generated</th>
              <th className="table-th text-right">Total</th>
              <th className="table-th text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="table-row">
                <td className="table-td font-medium">
                  {format(new Date(report.period_start), 'MMM d')} –{' '}
                  {format(new Date(report.period_end), 'MMM d, yyyy')}
                </td>
                <td className="table-td">
                  <Badge variant={typeVariant[report.report_type] || 'gray'}>
                    {report.report_type}
                  </Badge>
                </td>
                <td className="table-td text-gray-500 dark:text-gray-400">
                  {format(new Date(report.generated_at), 'MMM d, yyyy')}
                </td>
                <td className="table-td text-right font-semibold text-gray-900 dark:text-gray-100">
                  {fmt(report.total_expenses || 0)}
                </td>
                <td className="table-td">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => downloadReport(report.id)}
                      disabled={isDownloading}
                      className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="btn-ghost h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          <Button variant="secondary" size="sm" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
            Previous
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
