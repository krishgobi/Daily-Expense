import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import transactionService, { Transaction } from '../services/transactionService'

export const useTransactions = (filters?: {
  type?: 'BORROWED' | 'LENT'
  status?: 'PENDING' | 'COMPLETED'
  personName?: string
  limit?: number
  offset?: number
}) => {
  const queryClient = useQueryClient()

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionService.getTransactions(filters),
  })

  const createMutation = useMutation({
    mutationFn: (data: {
      type: 'BORROWED' | 'LENT'
      personName: string
      amount: number
      givenDate: string
      expectedReturnDate?: string
      purpose?: string
    }) =>
      transactionService.createTransaction(
        data.type,
        data.personName,
        data.amount,
        data.givenDate,
        data.expectedReturnDate,
        data.purpose,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: (data: { id: string; actualReturnDate: string }) =>
      transactionService.completeTransaction(data.id, data.actualReturnDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  return {
    transactions: result?.data || [],
    total: result?.meta.total || 0,
    isLoading,
    error,
    createTransaction: createMutation.mutate,
    isCreating: createMutation.isPending,
    completeTransaction: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
    deleteTransaction: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}

export const usePendingRepayments = () => {
  return useQuery({
    queryKey: ['transactions', 'pending-repayments'],
    queryFn: () => transactionService.getPendingRepayments(),
  })
}

export const usePendingCollections = () => {
  return useQuery({
    queryKey: ['transactions', 'pending-collections'],
    queryFn: () => transactionService.getPendingCollections(),
  })
}

export const useOverdueTransactions = () => {
  return useQuery({
    queryKey: ['transactions', 'overdue'],
    queryFn: () => transactionService.getOverdue(),
  })
}

export const useTransactionsSummary = () => {
  return useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => transactionService.getTransactionsSummary(),
  })
}
