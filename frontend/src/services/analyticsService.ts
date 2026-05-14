import { supabase } from './supabaseClient'
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns'

export interface MonthData {
  month:       string
  month_short: string
  total:       number
  count:       number
}

export interface SpendingTrend {
  trend:              'UP' | 'DOWN' | 'STABLE'
  percentage_change:  number
  last_month?:        number
  previous_average?:  number
}

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

class AnalyticsService {
  async getSpendingTrend(months: number = 6) {
    const userId = await getUserId()
    const now    = new Date()

    const monthsData: MonthData[] = []

    for (let i = months - 1; i >= 0; i--) {
      const d     = subMonths(now, i)
      const from  = format(startOfMonth(d), 'yyyy-MM-dd')
      const to    = format(endOfMonth(d), 'yyyy-MM-dd')

      const { data } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .gte('date', from)
        .lte('date', to)

      const total = (data || []).reduce((s, r) => s + Number(r.amount), 0)
      monthsData.push({
        month:       format(d, 'MMMM yyyy'),
        month_short: format(d, 'MMM'),
        total,
        count:       data?.length ?? 0,
      })
    }

    // Calculate trend: compare last month vs average of previous months
    const lastMonth = monthsData[monthsData.length - 1]?.total ?? 0
    const prevMonths = monthsData.slice(0, -1)
    const prevAvg = prevMonths.length
      ? prevMonths.reduce((s, m) => s + m.total, 0) / prevMonths.length
      : 0

    let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE'
    let pct = 0
    if (prevAvg > 0) {
      pct = Math.round(((lastMonth - prevAvg) / prevAvg) * 100)
      if (pct > 5)       trend = 'UP'
      else if (pct < -5) trend = 'DOWN'
    }

    return {
      months: monthsData,
      trend:  { trend, percentage_change: pct, last_month: lastMonth, previous_average: prevAvg },
    }
  }

  async getDashboardOverview() {
    const userId = await getUserId()
    const now    = new Date()
    const today  = format(now, 'yyyy-MM-dd')
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('amount, date, type, payment_method')
      .eq('user_id', userId)

    const rows = allExpenses || []
    const monthFrom = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthTo   = format(endOfMonth(now), 'yyyy-MM-dd')

    const todayTotal = rows.filter((r) => r.date === today).reduce((s, r) => s + Number(r.amount), 0)
    const weekFrom   = new Date(); weekFrom.setDate(weekFrom.getDate() - 7)
    const weekTotal  = rows.filter((r) => r.date >= format(weekFrom, 'yyyy-MM-dd')).reduce((s, r) => s + Number(r.amount), 0)
    const monthTotal = rows.filter((r) => r.date >= monthFrom && r.date <= monthTo).reduce((s, r) => s + Number(r.amount), 0)

    return {
      summary: { today: todayTotal, week: weekTotal, month: monthTotal },
      month: format(now, 'MMMM yyyy'),
    }
  }

  async getDailyBreakdown(year?: number, month?: number) {
    const userId = await getUserId()
    const now    = new Date()
    const y      = year  ?? now.getFullYear()
    const m      = month ?? now.getMonth() + 1
    const from   = `${y}-${String(m).padStart(2, '0')}-01`
    const to     = format(endOfMonth(new Date(y, m - 1)), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)

    const dayMap: Record<string, number> = {}
    for (const r of data || []) {
      dayMap[r.date] = (dayMap[r.date] || 0) + Number(r.amount)
    }

    return Object.entries(dayMap).map(([date, amount]) => ({
      date,
      day:    format(new Date(date), 'EEE'),
      amount,
      count:  (data || []).filter((r) => r.date === date).length,
    }))
  }

  async getTypeBreakdown(year?: number, month?: number) {
    const userId = await getUserId()
    const now    = new Date()
    const y      = year  ?? now.getFullYear()
    const m      = month ?? now.getMonth() + 1
    const from   = `${y}-${String(m).padStart(2, '0')}-01`
    const to     = format(endOfMonth(new Date(y, m - 1)), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('expenses')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)

    const rows  = data || []
    const cash  = rows.filter((r) => r.type === 'CASH')
    const dig   = rows.filter((r) => r.type === 'DIGITAL')
    const total = rows.reduce((s, r) => s + Number(r.amount), 0)
    const cashAmt = cash.reduce((s, r) => s + Number(r.amount), 0)
    const digAmt  = dig.reduce((s, r) => s + Number(r.amount), 0)

    return {
      CASH:    { amount: cashAmt, count: cash.length, percentage: total ? Math.round((cashAmt / total) * 100) : 0 },
      DIGITAL: { amount: digAmt,  count: dig.length,  percentage: total ? Math.round((digAmt  / total) * 100) : 0 },
    }
  }

  async getPaymentMethodBreakdown(year?: number, month?: number) {
    const userId = await getUserId()
    const now    = new Date()
    const y      = year  ?? now.getFullYear()
    const m      = month ?? now.getMonth() + 1
    const from   = `${y}-${String(m).padStart(2, '0')}-01`
    const to     = format(endOfMonth(new Date(y, m - 1)), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('expenses')
      .select('amount, payment_method')
      .eq('user_id', userId)
      .eq('type', 'DIGITAL')
      .gte('date', from)
      .lte('date', to)

    const methodMap: Record<string, { amount: number; count: number }> = {}
    for (const r of data || []) {
      const key = r.payment_method || 'Other'
      if (!methodMap[key]) methodMap[key] = { amount: 0, count: 0 }
      methodMap[key].amount += Number(r.amount)
      methodMap[key].count  += 1
    }

    return Object.entries(methodMap).map(([method, v]) => ({ method, ...v }))
  }
}

export default new AnalyticsService()
