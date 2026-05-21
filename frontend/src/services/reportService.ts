import api from './api'

export interface Report {
  id:              string
  user_id:         string
  report_type:     string
  period_start:    string
  period_end:      string
  total_expenses?: number
  total_borrowed?: number
  total_lent?:     number
  generated_at:    string
  format?:         string
  file_url?:       string
}

class ReportService {
  async generateReport(
    reportType: string,
    periodStart: string,
    periodEnd: string,
    format: 'PDF' | 'EXCEL' | 'WORD',
  ): Promise<Report> {
    const { data } = await api.post('/reports/generate', {
      report_type:  reportType,
      period_start: periodStart,
      period_end:   periodEnd,
      format,
    })
    return data.data as Report
  }

  async getReports(limit = 20, offset = 0) {
    const { data } = await api.get('/reports', { params: { limit, offset } })
    return {
      data: data.data as Report[],
      meta: data.meta as { total: number; limit: number; offset: number },
    }
  }

  async downloadReport(id: string, filename?: string) {
    const response = await api.get(`/reports/${id}/download`, { responseType: 'blob' })
    const blob = new Blob([response.data])
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename || `expense_report_${id}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async deleteReport(id: string) {
    await api.delete(`/reports/${id}`)
  }
}

export default new ReportService()
