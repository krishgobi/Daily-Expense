import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMonthEvents, useOverdueEvents } from '../hooks/useCalendar'
import { AppShell } from '../components/Layout/AppShell'

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)

  const { events, overdue, monthName, isLoading } = useMonthEvents(currentYear, currentMonth)
  const { overdue: overdueEvents } = useOverdueEvents()

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const handleNavigateToTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`)
  }

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            Calendar
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track due dates and overdue money movements.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  ← Previous
                </button>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {monthName} {currentYear}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Next →
                </button>
              </div>

              {/* Weekdays Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-2 text-center font-semibold text-gray-600 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {emptyDays.map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square"></div>
                ))}

                {days.map((day) => (
                  <div
                    key={day}
                    className={`aspect-square overflow-hidden rounded-xl border p-2 transition hover:shadow-md ${
                      isToday(day)
                        ? 'bg-blue-100 border-blue-400 dark:bg-blue-950/60 dark:border-blue-700'
                        : events[day]
                        ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800'
                        : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{day}</div>
                    {events[day] && (
                      <div className="mt-1 space-y-1">
                        {events[day].slice(0, 2).map((event, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleNavigateToTransaction(event.id)}
                            className={`text-xs w-full text-left px-1 py-0.5 rounded cursor-pointer truncate ${
                              event.is_overdue
                                ? 'bg-red-200 text-red-800 hover:bg-red-300'
                                : event.type === 'BORROWED'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={`${event.person}: ₹${event.amount}`}
                          >
                            {event.person.split(' ')[0]}
                          </button>
                        ))}
                        {events[day].length > 2 && (
                          <div className="px-1 text-xs text-gray-600 dark:text-gray-400">+{events[day].length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Overdue Section */}
              {overdue.length > 0 && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/40">
                  <h3 className="mb-2 font-semibold text-red-900 dark:text-red-200">Overdue Items This Month</h3>
                  <div className="space-y-1">
                    {overdue.map((item, idx) => (
                      <p key={idx} className="text-sm text-red-800 dark:text-red-300">
                        {item.person}: ₹{item.amount.toFixed(2)} ({item.overdue_days} days overdue)
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Overdue Alerts */}
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Overdue</h3>
              {overdueEvents.length > 0 ? (
                <div className="space-y-3">
                  {overdueEvents.slice(0, 5).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleNavigateToTransaction(event.id)}
                      className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-left transition hover:bg-red-100 dark:border-red-900/70 dark:bg-red-950/40 dark:hover:bg-red-950/60"
                    >
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200">{event.person}</p>
                      <p className="mt-1 text-xs text-red-700 dark:text-red-300">₹{event.amount.toFixed(2)}</p>
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{event.overdue_days} days overdue</p>
                    </button>
                  ))}
                  {overdueEvents.length > 5 && (
                    <p className="text-center text-xs text-gray-600 dark:text-gray-400">+{overdueEvents.length - 5} more overdue</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No overdue items</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
