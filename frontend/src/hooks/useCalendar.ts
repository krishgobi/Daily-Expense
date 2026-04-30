import { useQuery } from '@tanstack/react-query'
import calendarService from '../services/calendarService'

export const useMonthEvents = (year: number, month: number) => {
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['calendar', 'month', year, month],
    queryFn: () => calendarService.getMonthEvents(year, month),
  })

  return {
    events: result?.events || {},
    overdue: result?.overdue || [],
    year: result?.year || year,
    month: result?.month || month,
    monthName: result?.month_name || '',
    isLoading,
    error,
  }
}

export const useUpcomingEvents = (daysAhead?: number) => {
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['calendar', 'upcoming', daysAhead],
    queryFn: () => calendarService.getUpcomingEvents(daysAhead),
  })

  return {
    events: result?.events || [],
    daysAhead: result?.days_ahead || 30,
    totalEvents: result?.total_events || 0,
    isLoading,
    error,
  }
}

export const useOverdueEvents = () => {
  const { data: overdue = [], isLoading, error } = useQuery({
    queryKey: ['calendar', 'overdue'],
    queryFn: () => calendarService.getOverdueEvents(),
  })

  return {
    overdue,
    isLoading,
    error,
  }
}

export const useCalendarSummary = () => {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['calendar', 'summary'],
    queryFn: () => calendarService.getCalendarSummary(),
  })

  return {
    thisWeek: summary?.this_week || { count: 0, total: 0 },
    thisMonth: summary?.this_month || { count: 0, total: 0 },
    overdue: summary?.overdue || { count: 0, total: 0 },
    isLoading,
    error,
  }
}
