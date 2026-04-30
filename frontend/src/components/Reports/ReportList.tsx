import React, { useState } from 'react'
import { useReports } from '../../hooks/useReports'
import { format } from 'date-fns'

export const ReportList: React.FC = () => {
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)

  const { reports, total, isLoading, downloadReport, isDownloading, deleteReport } = useReports(limit, offset)

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReport(id)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading reports...</div>
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reports generated yet. Create your first report above!
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">📊 Generated Reports</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Period</th>
              <th className="text-left py-2 px-4">Type</th>
              <th className="text-left py-2 px-4">Generated</th>
              <th className="text-right py-2 px-4">Total Expenses</th>
              <th className="text-center py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  {format(new Date(report.period_start), 'MMM dd')} -{' '}
                  {format(new Date(report.period_end), 'MMM dd, yyyy')}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                    {report.report_type}
                  </span>
                </td>
                <td className="py-3 px-4">{format(new Date(report.generated_at), 'MMM dd, yyyy')}</td>
                <td className="py-3 px-4 text-right">₹{(report.total_expenses || 0).toFixed(2)}</td>
                <td className="py-3 px-4 text-center space-x-2">
                  <button
                    onClick={() => downloadReport(report.id)}
                    disabled={isDownloading}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-sm"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
