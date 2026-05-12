import React from 'react'
import { cn } from '../../lib/utils'
import { formatCurrency, formatDate } from '../../lib/utils'

interface ExpenseCardProps {
  expense: {
    id: string
    purpose: string
    amount: number
    description?: string
    date: string
    location?: string
    type: string
    category_id?: string
    payment_method?: string
    media?: any[]
    created_at: string
    updated_at: string
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ 
  expense, 
  onEdit, 
  onDelete, 
  className 
}) => {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm p-4 border border-gray-200', className)}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {expense.purpose}
          </h3>
          {expense.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {expense.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency(expense.amount)}
          </span>
          <div className="text-right">
            <span className="text-xs text-gray-500 block">
              {formatDate(expense.date)}
            </span>
            <span className="text-sm font-medium text-gray-900 block">
              {expense.type === 'cash' ? 'Cash' : 'Digital'}
            </span>
          </div>
        </div>
      </div>

      {/* Media Preview */}
      {expense.media && expense.media.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">Receipt</div>
          <div className="flex space-x-2 overflow-x-auto">
            {expense.media.map((media, index) => (
              <img
                key={index}
                src={media.url}
                alt={media.description || 'Expense receipt'}
                className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {expense.location && (
            <span className="flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.653l-7.795-7.795" />
              </svg>
              {expense.location}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(expense.id)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a1 1 0 0l-6 6" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-7 7 0 0l-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
