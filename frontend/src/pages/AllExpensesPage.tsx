import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react'
import { ExpenseList } from '../components/Expenses/ExpenseList'
import { Select } from '../components/UI/FormElements'

export const AllExpensesPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState<'all' | 'CASH' | 'DIGITAL'>('all')

  useEffect(() => {
    const type = searchParams.get('type') as 'CASH' | 'DIGITAL' | null
    if (type) setFilterType(type)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-surface-muted dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost h-9 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">All Expenses</h1>

          <div className="ml-auto flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="h-9 w-40 text-xs"
            >
              <option value="all">All Types</option>
              <option value="CASH">Cash</option>
              <option value="DIGITAL">Digital</option>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ExpenseList
          type={filterType === 'all' ? undefined : filterType}
          showAll={true}
        />
      </main>
    </div>
  )
}
