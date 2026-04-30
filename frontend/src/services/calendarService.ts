import api from './api'

export interface CalendarEvent {
  id: string
  person: string
  amount: number
  type: 'BORROWED' | 'LENT'
  purpose: string
  date: string
  is_overdue: boolean
  overdue_days: number
}

export interface UpcomingEvent {
  id: string
  person: string
  amount: number
  type: 'BORROWED' | 'LENT'
  date: string
  days_until: number
  is_today: boolean
  is_tomorrow: boolean
}

export interface MonthEventsData {
  events: Record<number, CalendarEvent[]>
  overdue: Array<{
    person: string
    amount: number
    type: 'BORROWED' | 'LENT'
    overdue_days: number
  }>
  year: number
  month: number
  month_name: string
}

export interface OverdueEvent {
  id: string
  person: string
  amount: number
  type: 'BORROWED' | 'LENT'
  date: string
  overdue_days: number
}

export interface CalendarSummary {
  this_week: {
    count: number
    total: number
  }
  this_month: {
    count: number
    total: number
  }
  overdue: {
    count: number
    total: number
  }
}

class CalendarService {
  async getMonthEvents(year: number, month: number) {
    const response = await api.get<{
      status: string
      data: MonthEventsData
    }>('/calendar/month', {
      params: {
        year,
        month,
      },
    })
    return response.data.data
  }

  async getUpcomingEvents(daysAhead?: number) {
    const response = await api.get<{
      status: string
      data: {
        events: UpcomingEvent[]
        days_ahead: number
        total_events: number
      }
    }>('/calendar/upcoming', {
      params: {
        days_ahead: daysAhead || 30,
      },
    })
    return response.data.data
  }

  async getOverdueEvents() {
    const response = await api.get<{
      status: string
      data: {
        overdue: OverdueEvent[]
        total: number
      }
    }>('/calendar/overdue')
    return response.data.data.overdue
  }

  async getCalendarSummary() {
    const response = await api.get<{
      status: string
      data: CalendarSummary
    }>('/calendar/summary')
    return response.data.data
  }
}

export default new CalendarService()
