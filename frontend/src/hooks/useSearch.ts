import { useQuery } from '@tanstack/react-query'
import searchService from '../services/searchService'

export const useSearchExpenses = (query: string, filters?: {
  expenseType?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) => {
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['search', 'expenses', query, filters],
    queryFn: () => searchService.searchExpenses(query, filters),
    enabled: !!query,
  })

  return {
    expenses: result?.expenses || [],
    total: result?.total || 0,
    query: result?.query || '',
    isLoading,
    error,
  }
}

export const useSearchTransactions = (query: string, filters?: {
  transactionType?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) => {
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['search', 'transactions', query, filters],
    queryFn: () => searchService.searchTransactions(query, filters),
    enabled: !!query,
  })

  return {
    transactions: result?.transactions || [],
    total: result?.total || 0,
    query: result?.query || '',
    isLoading,
    error,
  }
}

export const useGlobalSearch = (query: string, limit?: number) => {
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['search', 'global', query, limit],
    queryFn: () => searchService.globalSearch(query, limit),
    enabled: !!query,
  })

  return {
    expenses: result?.expenses || [],
    transactions: result?.transactions || [],
    query: result?.query || '',
    isLoading,
    error,
  }
}

export const useRecentSearches = (limit?: number) => {
  const { data: recent = [], isLoading, error } = useQuery({
    queryKey: ['search', 'recent', limit],
    queryFn: () => searchService.getRecentSearches(limit),
  })

  return {
    recent,
    isLoading,
    error,
  }
}
