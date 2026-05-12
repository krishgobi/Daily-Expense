import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseKeys, queryInvalidation } from '../lib/api/react-query'

// Types for expense data
interface Expense {
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

interface ExpenseFilters {
  type?: string
  category_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

interface ExpenseResponse {
  data: Expense[]
  total: number
  limit: number
  offset: number
  has_more: boolean
  page: number
  total_pages: number
}

// Main expense query hook with pagination and caching
export const useExpenses = (filters: ExpenseFilters = {}) => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: expenseKeys.lists(filters),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/v1/expenses?limit=${filters.limit || 20}&offset=${filters.offset || 0}${filters.type ? `&type=${filters.type}` : ''}${filters.category_id ? `&category_id=${filters.category_id}` : ''}${filters.date_from ? `&date_from=${filters.date_from}` : ''}${filters.date_to ? `&date_to=${filters.date_to}` : ''}`)
        const data = await response.json()
        return data.data
      } catch (error) {
        console.error('Failed to load expenses:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  })
}

// Hook for creating expenses
export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseData, type }: { expenseData: any; type: 'cash' | 'digital' }) => {
      try {
        const endpoint = type === 'cash' ? '/api/v1/expenses/cash' : '/api/v1/expenses/digital'
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData)
        })
        const data = await response.json()
        console.log(`${type} expense created:`, data)
        return data.data
      } catch (error) {
        console.error(`Failed to create ${type} expense:`, error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate expense queries to refresh data
      queryClient.invalidateQueries({
        queryKey: expenseKeys.lists({})
      })
    },
    onSettled: () => {
      // Also invalidate summary queries
      queryClient.invalidateQueries({
        queryKey: [
          expenseKeys.summary.today,
          expenseKeys.summary.week,
          expenseKeys.summary.month,
        ]
      })
    },
  })
}

// Hook for updating expenses
export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      try {
        const response = await fetch(`/api/v1/expenses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        const result = await response.json()
        console.log('Expense updated:', result)
        return result.data
      } catch (error) {
        console.error('Failed to update expense:', error)
        throw error
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate specific expense and list queries
      queryClient.invalidateQueries({
        queryKey: [
          expenseKeys.detail(variables.id),
          expenseKeys.lists({}),
        ]
      })
    },
    onSettled: () => {
      // Also invalidate summary queries
      queryClient.invalidateQueries({
        queryKey: [
          expenseKeys.summary.today,
          expenseKeys.summary.week,
          expenseKeys.summary.month,
        ]
      })
    },
  })
}

// Hook for deleting expenses
export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await fetch(`/api/v1/expenses/${id}`, {
          method: 'DELETE'
        })
        const data = await response.json()
        console.log('Expense deleted:', data)
        return data.data
      } catch (error) {
        console.error('Failed to delete expense:', error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({
        queryKey: queryInvalidation.invalidateExpenses()
      })
    },
    onSettled: () => {
      // Also invalidate summary queries
      queryClient.invalidateQueries({
        queryKey: [
          expenseKeys.summary.today,
          expenseKeys.summary.week,
          expenseKeys.summary.month,
        ]
      })
    },
  })
}

// Hook for getting a single expense
export const useExpense = (id: string) => {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/v1/expenses/${id}`)
        const data = await response.json()
        return data.data
      } catch (error) {
        console.error('Failed to load expense:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
  })
}

// Hook for expense summaries
export const useExpenseSummary = (type: 'today' | 'week' | 'month', params?: any) => {
  return useQuery({
    queryKey: [expenseKeys.summary[type]],
    queryFn: async () => {
      try {
        const endpoint = type === 'today' ? '/api/v1/expenses/summary/today' : 
                          type === 'week' ? '/api/v1/expenses/summary/week' : 
                          '/api/v1/expenses/summary/month'
        const response = await fetch(`${endpoint}${params ? '?' + new URLSearchParams(params).toString() : ''}`)
        const data = await response.json()
        return data.data
      } catch (error) {
        console.error(`Failed to load ${type} summary:`, error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: true,
  })
}

// Hook for categories
export const useCategories = () => {
  return useQuery({
    queryKey: [expenseKeys.categories],
    queryFn: async () => {
      try {
        const response = await fetch('/api/v1/categories')
        const data = await response.json()
        return data.data
      } catch (error) {
        console.error('Failed to load categories:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
  })
}
