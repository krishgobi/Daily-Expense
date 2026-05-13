import { supabase } from './supabaseClient'

export interface Report {
  id:               string
  user_id:          string
  report_type:      'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  period_start:     string
  period_end:       string
  total_expenses?:  number
  total_borrowed?:  number
  total_lent?:      number
  generated_at:     string
  format?:          string
  file_url?:        string
}

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

class ReportService {
  async generateReport(
    reportType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    periodStart: string,
    periodEnd: string,
    format: 'PDF' | 'EXCEL' | 'WORD',
  ) {
    const userId = await getUserId()

    // Calculate totals from expenses table
    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', periodStart)
      .lte('date', periodEnd)

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('given_date', periodStart)
      .lte('given_date', periodEnd)

    const totalExpenses = (expenseData || []).reduce((s, r) => s + Number(r.amount), 0)
    const totalBorrowed = (txData || []).filter((r) => r.transaction_type === 'BORROWED').reduce((s, r) => s + Number(r.amount), 0)
    const totalLent     = (txData || []).filter((r) => r.transaction_type === 'LENT').reduce((s, r) => s + Number(r.amount), 0)

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id:         userId,
        report_type:     reportType,
        period_start:    periodStart,
        period_end:      periodEnd,
        total_expenses:  totalExpenses,
        total_borrowed:  totalBorrowed,
        total_lent:      totalLent,
        format,
        generated_at:    new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data as Report
  }

  async getReports(limit: number = 20, offset: number = 0) {
    const userId = await getUserId()
    const { data, error, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return {
      data: (data || []) as Report[],
      meta: { total: count ?? 0, limit, offset },
    }
  }

  async getReport(id: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Report
  }

  async downloadReport(id: string) {
    const report = await this.getReport(id)
    if (report.file_url) {
      window.open(report.file_url, '_blank')
      return
    }
    // Fallback: generate a simple CSV in-browser
    const userId = await getUserId()
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', report.period_start)
      .lte('date', report.period_end)
      .order('date', { ascending: true })

    const rows = [
      ['Date', 'Purpose', 'Type', 'Amount', 'Payment Method', 'Location', 'Description'],
      ...(expenses || []).map((e) => [
        e.date, e.purpose, e.type, e.amount,
        e.payment_method || '', e.location || '', e.description || '',
      ]),
    ]
    const csv  = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `report_${report.period_start}_${report.period_end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async deleteReport(id: string) {
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) throw error
  }
}

export default new ReportService()
