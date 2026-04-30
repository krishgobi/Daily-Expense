import React, { useState } from 'react'
import { useReports } from '../../hooks/useReports'
import { format, subMonths, subQuarters, subYears } from 'date-fns'

interface ReportGeneratorProps {
  onSuccess?: () => void
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onSuccess }) => {
  const [reportType, setReportType] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY')
  const [exportFormat, setExportFormat] = useState<'PDF' | 'EXCEL' | 'WORD'>('PDF')
  const [error, setError] = useState('')

  const { generateReport, isGenerating } = useReports()

  const handleGenerate = () => {
    setError('')

    const today = new Date()
    let periodStart, periodEnd

    periodEnd = format(today, 'yyyy-MM-dd')

    if (reportType === 'MONTHLY') {
      periodStart = format(subMonths(today, 1), 'yyyy-MM-dd')
    } else if (reportType === 'QUARTERLY') {
      periodStart = format(subQuarters(today, 1), 'yyyy-MM-dd')
    } else {
      periodStart = format(subYears(today, 1), 'yyyy-MM-dd')
    }

    try {
      generateReport({
        reportType,
        periodStart,
        periodEnd,
        format: exportFormat,
      })
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report')
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6">📋 Generate Report</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Period
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'MONTHLY' | 'QUARTERLY' | 'YEARLY')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'PDF' | 'EXCEL' | 'WORD')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PDF">📄 PDF</option>
            <option value="EXCEL">📊 Excel</option>
            <option value="WORD">📝 Word</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  )
}
