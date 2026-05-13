import React, { useState } from 'react'
import { format, subMonths, subQuarters, subYears } from 'date-fns'
import { FileText, AlertCircle } from 'lucide-react'
import { useReports } from '../../hooks/useReports'
import { FormField, Select } from '../UI/FormElements'
import { Button } from '../UI/Button'

interface ReportGeneratorProps {
  onSuccess?: () => void
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onSuccess }) => {
  const [reportType, setReportType]   = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY')
  const [exportFormat, setExportFormat] = useState<'PDF' | 'EXCEL' | 'WORD'>('PDF')
  const [error, setError]             = useState('')

  const { generateReport, isGenerating } = useReports()

  const handleGenerate = () => {
    setError('')
    const today = new Date()
    const periodEnd   = format(today, 'yyyy-MM-dd')
    const periodStart = format(
      reportType === 'MONTHLY'   ? subMonths(today, 1)
      : reportType === 'QUARTERLY' ? subQuarters(today, 1)
      : subYears(today, 1),
      'yyyy-MM-dd',
    )

    try {
      generateReport({ reportType, periodStart, periodEnd, format: exportFormat })
      onSuccess?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report')
    }
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40">
          <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        </span>
        <div>
          <h3 className="section-title">Generate Report</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Export your expense summary</p>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <FormField label="Report Period">
          <Select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
            <option value="MONTHLY">Monthly (last 30 days)</option>
            <option value="QUARTERLY">Quarterly (last 3 months)</option>
            <option value="YEARLY">Yearly (last 12 months)</option>
          </Select>
        </FormField>

        <FormField label="Export Format">
          <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}>
            <option value="PDF">PDF Document</option>
            <option value="EXCEL">Excel Spreadsheet</option>
            <option value="WORD">Word Document</option>
          </Select>
        </FormField>

        <Button
          variant="primary"
          fullWidth
          loading={isGenerating}
          onClick={handleGenerate}
          icon={<FileText className="h-4 w-4" />}
        >
          {isGenerating ? 'Generating…' : 'Generate Report'}
        </Button>
      </div>
    </div>
  )
}
