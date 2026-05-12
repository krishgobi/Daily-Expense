import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export interface Expense {
  id: string
  user_id: string
  type: 'CASH' | 'DIGITAL'
  purpose: string
  amount: number
  description?: string
  date: string
  location?: string
  payment_method?: string
  created_at: string
  media?: any[]
}

export const useSupabaseExpenses = (filters?: {
  type?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const result = useQuery({
    queryKey: ['expenses', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      let query = supabase
        .from('expenses')
        .select(`
          id,
          user_id,
          type,
          purpose,
          amount,
          description,
          date,
          location,
          payment_method,
          created_at,
          media
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  return {
    data: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    total: result.data?.length || 0,
  }
}

export const useCreateSupabaseExpense = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseData: {
      type: 'CASH' | 'DIGITAL'
      purpose: string
      amount: number
      date: string
      description?: string
      location?: string
      payment_method?: string
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          ...expenseData,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export const useDeleteSupabaseExpense = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  return {
    deleteExpense: mutation.mutate,
    isDeleting: mutation.isPending,
  }
}

// Realtime subscription for expenses
export const useExpensesRealtime = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])
}
