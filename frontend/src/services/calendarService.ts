import { supabase } from './supabaseClient'
import { format, differenceInDays } from 'date-fns'

export interface CalendarEvent {
  id:          string
  person:      string
  amount:      number
  type:        'BORROWED' | 'LENT'
  purpose:     string
  date:        string
  is_overdue:  boolean
  overdue_days: number
}

export interface OverdueEvent {
  id:          string
  person:      string
  amount:      number
  type:        'BORROWED' | 'LENT'
  date:        string
  overdue_days: number
}

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

class CalendarService {
  async getMonthEvents(year: number, month: number) {
    const userId = await getUserId()
    const from   = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const to     = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const today  = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transactions')
      .select('id, transaction_type, person_name, amount, purpose, expected_return_date, status')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .not('expected_return_date', 'is', null)
      .gte('expected_return_date', from)
      .lte('expected_return_date', to)

    if (error) throw error

    const events: Record<number, CalendarEvent[]> = {}
    const overdue: Array<{ person: string; amount: number; type: 'BORROWED' | 'LENT'; overdue_days: number }> = []

    for (const row of data || []) {
      const day = new Date(row.expected_return_date).getDate()
      const isOverdue = row.expected_return_date < today
      const overdueDays = isOverdue
        ? differenceInDays(new Date(today), new Date(row.expected_return_date))
        : 0

      if (!events[day]) events[day] = []
      events[day].push({
        id:          row.id,
        person:      row.person_name,
        amount:      Number(row.amount),
        type:        row.transaction_type,
        purpose:     row.purpose || '',
        date:        row.expected_return_date,
        is_overdue:  isOverdue,
        overdue_days: overdueDays,
      })

      if (isOverdue) {
        overdue.push({ person: row.person_name, amount: Number(row.amount), type: row.transaction_type, overdue_days: overdueDays })
      }
    }

    return {
      events,
      overdue,
      year,
      month,
      month_name: MONTH_NAMES[month - 1],
    }
  }

  async getOverdueEvents(): Promise<OverdueEvent[]> {
    const userId = await getUserId()
    const today  = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transactions')
      .select('id, transaction_type, person_name, amount, expected_return_date')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .not('expected_return_date', 'is', null)
      .lt('expected_return_date', today)
      .order('expected_return_date', { ascending: true })

    if (error) throw error

    return (data || []).map((row) => ({
      id:          row.id,
      person:      row.person_name,
      amount:      Number(row.amount),
      type:        row.transaction_type,
      date:        row.expected_return_date,
      overdue_days: differenceInDays(new Date(today), new Date(row.expected_return_date)),
    }))
  }

  async getUpcomingEvents(daysAhead: number = 30) {
    const userId = await getUserId()
    const today  = new Date().toISOString().split('T')[0]
    const future = new Date(); future.setDate(future.getDate() + daysAhead)
    const to     = future.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transactions')
      .select('id, transaction_type, person_name, amount, expected_return_date')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .not('expected_return_date', 'is', null)
      .gte('expected_return_date', today)
      .lte('expected_return_date', to)
      .order('expected_return_date', { ascending: true })

    if (error) throw error

    const events = (data || []).map((row) => {
      const daysUntil = differenceInDays(new Date(row.expected_return_date), new Date(today))
      return {
        id:          row.id,
        person:      row.person_name,
        amount:      Number(row.amount),
        type:        row.transaction_type,
        date:        row.expected_return_date,
        days_until:  daysUntil,
        is_today:    daysUntil === 0,
        is_tomorrow: daysUntil === 1,
      }
    })

    return { events, days_ahead: daysAhead, total_events: events.length }
  }

  async getCalendarSummary() {
    const userId = await getUserId()
    const today  = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekEnd  = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const { data } = await supabase
      .from('transactions')
      .select('amount, expected_return_date, status')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .not('expected_return_date', 'is', null)

    const rows = data || []
    const thisWeek  = rows.filter((r) => r.expected_return_date >= todayStr && r.expected_return_date <= weekEnd.toISOString().split('T')[0])
    const thisMonth = rows.filter((r) => r.expected_return_date >= todayStr && r.expected_return_date <= monthEnd.toISOString().split('T')[0])
    const overdue   = rows.filter((r) => r.expected_return_date < todayStr)

    const sum = (arr: any[]) => arr.reduce((s, r) => s + Number(r.amount), 0)

    return {
      this_week:  { count: thisWeek.length,  total: sum(thisWeek) },
      this_month: { count: thisMonth.length, total: sum(thisMonth) },
      overdue:    { count: overdue.length,   total: sum(overdue) },
    }
  }
}

export default new CalendarService()
