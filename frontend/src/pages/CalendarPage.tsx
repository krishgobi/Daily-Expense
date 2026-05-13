import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useMonthEvents, useOverdueEvents } from '../hooks/useCalendar'
import { AppShell } from '../components/Layout/AppShell'
import { Badge } from '../components/UI/Badge'
import { cn } from '../lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const today    = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const { events, overdue, monthName, isLoading } = useMonthEvents(year, month)
  const { overdue: overdueEvents } = useOverdueEvents()

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1) } else setMonth(month - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1) } else setMonth(month + 1) }

  const daysInMonth   = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Track due dates and overdue money movements.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={prevMonth}
                  className="btn-ghost h-8 w-8 p-0"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {monthName} {year}
                </h2>
                <button
                  onClick={nextMonth}
                  className="btn-ghost h-8 w-8 p-0"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`e-${i}`} />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dayEvents = events[day] || []
                    const hasEvents = dayEvents.length > 0
                    const todayCell = isToday(day)

                    return (
                      <div
                        key={day}
                        className={cn(
                          'min-h-[52px] rounded-xl border p-1.5 transition',
                          todayCell
                            ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/40'
                            : hasEvents
                            ? 'border-amber-200 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20'
                            : 'border-gray-100 bg-white hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700',
                        )}
                      >
                        <span className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
                          todayCell
                            ? 'bg-brand-600 text-white'
                            : 'text-gray-700 dark:text-gray-300',
                        )}>
                          {day}
                        </span>

                        {dayEvents.slice(0, 2).map((ev, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigate(`/transactions/${ev.id}`)}
                            title={`${ev.person}: ₹${ev.amount}`}
                            className={cn(
                              'mt-0.5 w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium transition',
                              ev.is_overdue
                                ? 'bg-red-200 text-red-800 hover:bg-red-300 dark:bg-red-900/60 dark:text-red-300'
                                : ev.type === 'BORROWED'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
                            )}
                          >
                            {ev.person.split(' ')[0]}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 px-1">
                            +{dayEvents.length - 2}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Overdue this month */}
              {overdue.length > 0 && (
                <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                      Overdue this month
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {overdue.map((item, i) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-300">
                        {item.person}: ₹{item.amount.toFixed(2)} — {item.overdue_days} days overdue
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Legend */}
            <div className="card p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Legend</h3>
              <div className="space-y-1.5">
                {[
                  { color: 'bg-red-100 dark:bg-red-950/40', label: 'Borrowed' },
                  { color: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Lent' },
                  { color: 'bg-red-200 dark:bg-red-900/60', label: 'Overdue' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={cn('h-3 w-3 rounded', color)} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue alerts */}
            <div className="card p-4">
              <h3 className="section-title mb-3">All Overdue</h3>
              {overdueEvents.length > 0 ? (
                <div className="space-y-2">
                  {overdueEvents.slice(0, 6).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => navigate(`/transactions/${ev.id}`)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-left transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                    >
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200">{ev.person}</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                        ₹{ev.amount.toFixed(2)} · {ev.overdue_days}d overdue
                      </p>
                    </button>
                  ))}
                  {overdueEvents.length > 6 && (
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      +{overdueEvents.length - 6} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No overdue items 🎉</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
