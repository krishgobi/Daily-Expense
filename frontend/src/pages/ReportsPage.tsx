import React, { useState } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { FileText, Download, Trash2, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '../components/Layout/AppShell'
import { FormField, Input } from '../components/UI/FormElements'
import { EmptyState } from '../components/UI/EmptyState'
import reportService, { Report } from '../services/reportService'

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const PRESETS = [
  { label: 'This month',    start: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'),              end: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last month',    start: () => format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), end: () => format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd') },
  { label: 'Last 3 months', start: () => format(subMonths(new Date(), 3), 'yyyy-MM-dd'),               end: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 6 months', start: () => format(subMonths(new Date(), 6), 'yyyy-MM-dd'),               end: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Custom',        start: () => '',                                                            end: () => '' },
]

const reportTypeFor = (preset: number) => {
  if (preset <= 1) return 'MONTHLY'
  if (preset === 2) return 'QUARTERLY'
  return 'YEARLY'
}

export const ReportsPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [preset, setPreset]           = useState(0)
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const periodStart = preset < 4 ? PRESETS[preset].start() : customStart
  const periodEnd   = preset < 4 ? PRESETS[preset].end()   : customEnd

  const { data: result, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getReports(20, 0),
  })
  const reports = result?.data || []

  const generateMutation = useMutation({
    mutationFn: () =>
      reportService.generateReport(reportTypeFor(preset), periodStart, periodEnd, 'PDF'),
    onSuccess: async (report) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setSuccess('Downloaded!')
      setTimeout(() => setSuccess(''), 3000)
      await reportService.downloadReport(
        report.id,
        `expense_report_${periodStart}_${periodEnd}.pdf`,
      )
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Failed to generate report')
      setTimeout(() => setError(''), 5000)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  })

  const handleDownload = async (report: Report) => {
    setDownloading(report.id)
    try {
      const ext = report.format === 'EXCEL' ? 'xlsx' : 'pdf'
      await reportService.downloadReport(
        report.id,
        `expense_report_${report.period_start}_${report.period_end}.${ext}`,
      )
    } catch {
      setError('Download failed. Please try again.')
      setTimeout(() => setError(''), 4000)
    } finally {
      setDownloading(null)
    }
  }

  const isGenerating = generateMutation.isPending

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Download your expense summaries</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Generator card */}
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
              <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Generate Report</p>
          </div>

          {/* Period preset chips */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPreset(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  preset === i
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          {preset === 4 ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="From">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd}
                />
              </FormField>
              <FormField label="To">
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </FormField>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(periodStart), 'MMM d, yyyy')} – {format(new Date(periodEnd), 'MMM d, yyyy')}
            </p>
          )}

          {/* Download PDF button */}
          <button
            onClick={() => { setError(''); generateMutation.mutate() }}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4 shrink-0" />
            {isGenerating ? 'Generating…' : 'Download PDF'}
          </button>
        </div>

        {/* Past reports */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Past Reports</h3>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-3 w-20 rounded bg-gray-50 dark:bg-gray-800/60" />
                  </div>
                  <div className="h-6 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<BarChart3 className="h-5 w-5" />}
                title="No reports yet"
                desc="Generate your first report above."
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(report.period_start), 'MMM d')} –{' '}
                      {format(new Date(report.period_end), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {report.format || 'PDF'} · {report.total_expenses != null ? fmt(report.total_expenses) : '—'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleDownload(report)}
                      disabled={downloading === report.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-600 transition hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Delete this report?')) deleteMutation.mutate(report.id) }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/40"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
