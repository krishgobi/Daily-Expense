import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { TransactionList } from '../components/Transactions/TransactionList'
import { Select } from '../components/UI/FormElements'

export const AllTransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filterType,   setFilterType]   = useState<'all' | 'BORROWED' | 'LENT'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'COMPLETED'>('all')

  useEffect(() => {
    const type   = searchParams.get('type')   as 'BORROWED' | 'LENT' | null
    const status = searchParams.get('status') as 'PENDING' | 'COMPLETED' | null
    if (type)   setFilterType(type)
    if (status) setFilterStatus(status)
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
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">All Transactions</h1>

          <div className="ml-auto flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="h-9 w-36 text-xs"
            >
              <option value="all">All Types</option>
              <option value="BORROWED">Borrowed</option>
              <option value="LENT">Lent</option>
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-9 w-36 text-xs"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <TransactionList
          type={filterType === 'all' ? undefined : filterType}
          status={filterStatus === 'all' ? undefined : filterStatus}
          showAll={true}
        />
      </main>
    </div>
  )
}
