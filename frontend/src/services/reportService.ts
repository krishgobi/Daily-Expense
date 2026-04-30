import api from './api'

export interface Report {
  id: string
  user_id: string
  report_type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  period_start: string
  period_end: string
  total_expenses?: number
  total_borrowed?: number
  total_lent?: number
  generated_at: string
}

class ReportService {
  async generateReport(
    reportType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    periodStart: string,
    periodEnd: string,
    format: 'PDF' | 'EXCEL' | 'WORD',
  ) {
    const response = await api.post<{ status: string; data: Report }>('/reports/generate', {
      report_type: reportType,
      period_start: periodStart,
      period_end: periodEnd,
      format,
    })
    return response.data.data
  }

  async getReports(limit: number = 20, offset: number = 0) {
    const response = await api.get<{
      status: string
      data: Report[]
      meta: { total: number; limit: number; offset: number }
    }>('/reports', {
      params: { limit, offset },
    })
    return response.data
  }

  async getReport(id: string) {
    const response = await api.get<{ status: string; data: Report }>(`/reports/${id}`)
    return response.data.data
  }

  async downloadReport(id: string) {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    })

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition']
    let filename = 'report.pdf'
    if (contentDisposition) {
      const filenamePart = contentDisposition.split('filename=')[1]
      if (filenamePart) {
        filename = filenamePart.replace(/"/g, '')
      }
    }

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

  async deleteReport(id: string) {
    await api.delete(`/reports/${id}`)
  }
}

export default new ReportService()
