import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseKeys, queryInvalidation } from '../lib/api/react-query'
import { expenseService } from '../services/expenseService'
import { toast } from '../context/ToastContext'

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

  return useQuery<ExpenseResponse>({
    queryKey: expenseKeys.lists(filters),
    queryFn: async () => {
      try {
        const response = await expenseService.getExpenses(filters)
        return response.data
      } catch (error) {
        toast.error('Failed to load expenses')
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: true,
  })
}

// Hook for creating expenses
export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseData: any, type: 'cash' | 'digital') => {
      try {
        const response = await expenseService.createExpense(expenseData, type)
        toast.success(`${type === 'cash' ? 'Cash' : 'Digital'} expense created successfully`)
        return response.data
      } catch (error) {
        toast.error(`Failed to create ${type} expense`)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate expense queries to refresh data
      queryClient.invalidateQueries({
        queryKey: expenseKeys.lists(),
        refetchType: 'active'
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
        const response = await expenseService.updateExpense(id, data)
        toast.success('Expense updated successfully')
        return response.data
      } catch (error) {
        toast.error('Failed to update expense')
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate specific expense and list queries
      queryClient.invalidateQueries({
        queryKey: [
          expenseKeys.detail(id),
          expenseKeys.lists(),
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
        const response = await expenseService.deleteExpense(id)
        toast.success('Expense deleted successfully')
        return response.data
      } catch (error) {
        toast.error('Failed to delete expense')
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
  return useQuery<Expense>({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await expenseService.getExpense(id)
        return response.data
      } catch (error) {
        toast.error('Failed to load expense')
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
  })
}

// Hook for expense summaries
export const useExpenseSummary = (type: 'today' | 'week' | 'month', params?: any) => {
  return useQuery({
    queryKey: expenseKeys.summary[type],
    queryFn: async () => {
      try {
        const response = await expenseService.getExpenseSummary(type, params)
        return response.data
      } catch (error) {
        toast.error(`Failed to load ${type} summary`)
        throw error
      }
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    cacheTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

// Hook for categories
export const useCategories = () => {
  return useQuery({
    queryKey: expenseKeys.categories,
    queryFn: async () => {
      try {
        const response = await expenseService.getCategories()
        return response.data
      } catch (error) {
        toast.error('Failed to load categories')
        throw error
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: true,
  })
}
