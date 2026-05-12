import React, { useState } from 'react'
import { cn } from '../../lib/utils'

interface MobileExpenseFormProps {
  onSubmit: (data: any) => void
  type: 'cash' | 'digital'
  initialData?: any
  className?: string
}

export const MobileExpenseForm: React.FC<MobileExpenseFormProps> = ({ 
  onSubmit, 
  type, 
  initialData, 
  className 
}) => {
  const [formData, setFormData] = useState({
    purpose: initialData?.purpose || '',
    amount: initialData?.amount || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    location: initialData?.location || '',
    category_id: initialData?.category_id || '',
    payment_method: initialData?.payment_method || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Purpose Input */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
          Purpose
        </label>
        <input
          type="text"
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          placeholder="Enter expense purpose"
          required
          style={{ minHeight: '44px' }} // Touch-friendly minimum size
        />
      </div>

      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-500">$</span>
          <input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full pl-8 pr-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            placeholder="0.00"
            required
            inputMode="decimal"
            step="0.01"
            style={{ minHeight: '44px' }} // Touch-friendly minimum size
          />
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
          placeholder="Enter expense description"
          rows={3}
          style={{ minHeight: '44px' }} // Touch-friendly minimum size
        />
      </div>

      {/* Date Input */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          required
          style={{ minHeight: '44px' }} // Touch-friendly minimum size
        />
      </div>

      {/* Location Input */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          placeholder="Enter location"
          style={{ minHeight: '44px' }} // Touch-friendly minimum size
        />
      </div>

      {/* Category Select */}
      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          id="category_id"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          style={{ minHeight: '44px' }} // Touch-friendly minimum size
        >
          <option value="">Select category</option>
          <option value="1">Food</option>
          <option value="2">Transport</option>
          <option value="3">Entertainment</option>
          <option value="4">Shopping</option>
          <option value="5">Bills</option>
          <option value="6">Healthcare</option>
        </select>
      </div>

      {/* Payment Method Select */}
      <div>
        <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <select
          id="payment_method"
          value={formData.payment_method}
          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          style={{ minHeight: '44px' }} // Touch-friendly minimum size
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="netbanking">Net Banking</option>
        </select>
      </div>

      {/* Screenshot Upload - Only for Digital Expenses */}
      {type === 'digital' && (
        <div>
          <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-2">
            Screenshot (Optional)
          </label>
          <input
            type="file"
            id="screenshot"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, screenshot: e.target.files?.[0] })}
            className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            style={{ minHeight: '44px' }} // Touch-friendly minimum size
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ minHeight: '44px' }} // Touch-friendly minimum size
        >
          {type === 'cash' ? 'Add Cash Expense' : 'Add Digital Expense'}
        </button>
      </div>
    </form>
  )
}
