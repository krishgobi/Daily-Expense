import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter, Search } from 'lucide-react'
import { TransactionList } from '../components/Transactions/TransactionList'
import { useTransactions } from '../hooks/useTransactions'

export const AllTransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'BORROWED' | 'LENT'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'COMPLETED'>('all')

  // Get initial filter values from URL params
  useEffect(() => {
    const type = searchParams.get('type') as 'BORROWED' | 'LENT' | null
    const status = searchParams.get('status') as 'PENDING' | 'COMPLETED' | null
    
    if (type) setFilterType(type)
    if (status) setFilterStatus(status)
  }, [searchParams])

  const handleBack = () => {
    navigate(-1)
  }

  const getFilteredType = () => {
    return filterType === 'all' ? undefined : filterType
  }

  const getFilteredStatus = () => {
    return filterStatus === 'all' ? undefined : filterStatus
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                All Transactions
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="BORROWED">Money Borrowed</option>
                <option value="LENT">Money Lent</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <TransactionList 
            type={getFilteredType()} 
            status={getFilteredStatus()}
            showAll={true}
          />
        </div>
      </div>
    </div>
  )
}
