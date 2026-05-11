import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import expenseService from '../services/expenseService'
import { useToast } from '../context/ToastContext'

export const useExpenses = (filters?: {
  type?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) => {
  const queryClient = useQueryClient()

  const { data: result, isLoading, error, isFetching } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseService.getExpenses(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const { showSuccess, showError } = useToast()

  const createCashMutation = useMutation({
    mutationFn: (data: {
      purpose: string
      amount: number
      date: string
      description?: string
      location?: string
    }) =>
      expenseService.createCashExpense(
        data.purpose,
        data.amount,
        data.date,
        data.description,
        data.location,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      showSuccess('Cash expense added successfully!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to add cash expense')
    },
  })

  const createDigitalMutation = useMutation({
    mutationFn: (data: {
      purpose: string
      amount: number
      paymentMethod: string
      date: string
      description?: string
      location?: string
    }) =>
      expenseService.createDigitalExpense(
        data.purpose,
        data.amount,
        data.paymentMethod,
        data.date,
        data.description,
        data.location,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      showSuccess('Digital expense added successfully!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to add digital expense')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      showSuccess('Expense deleted successfully!')
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || 'Failed to delete expense')
    },
  })

  return {
    expenses: result?.data || [],
    total: result?.meta.total || 0,
    isLoading,
    isFetching,
    error,
    createCashExpense: createCashMutation.mutate,
    createCashExpenseAsync: createCashMutation.mutateAsync,
    isCreatingCash: createCashMutation.isPending,
    createDigitalExpense: createDigitalMutation.mutate,
    createDigitalExpenseAsync: createDigitalMutation.mutateAsync,
    isCreatingDigital: createDigitalMutation.isPending,
    deleteExpense: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}

export const useTodaySummary = () => {
  return useQuery({
    queryKey: ['summary', 'today'],
    queryFn: () => expenseService.getTodaySummary(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export const useWeekSummary = () => {
  return useQuery({
    queryKey: ['summary', 'week'],
    queryFn: () => expenseService.getWeekSummary(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  })
}

export const useMonthSummary = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['summary', 'month', year, month],
    queryFn: () => expenseService.getMonthSummary(year, month),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  })
}
