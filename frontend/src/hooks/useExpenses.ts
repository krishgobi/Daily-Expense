import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import expenseService, { Expense, Category } from '../services/expenseService'

export const useCategories = () => {
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => expenseService.getCategories(),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; icon?: string; color?: string }) =>
      expenseService.createCategory(data.name, data.icon, data.color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteCategory: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}

export const useExpenses = (filters?: {
  type?: string
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) => {
  const queryClient = useQueryClient()

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseService.getExpenses(filters),
  })

  const createCashMutation = useMutation({
    mutationFn: (data: {
      purpose: string
      amount: number
      date: string
      categoryId?: string
      description?: string
      location?: string
    }) =>
      expenseService.createCashExpense(
        data.purpose,
        data.amount,
        data.date,
        data.categoryId,
        data.description,
        data.location,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const createDigitalMutation = useMutation({
    mutationFn: (data: {
      purpose: string
      amount: number
      paymentMethod: string
      date: string
      categoryId?: string
      description?: string
      location?: string
    }) =>
      expenseService.createDigitalExpense(
        data.purpose,
        data.amount,
        data.paymentMethod,
        data.date,
        data.categoryId,
        data.description,
        data.location,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })

  return {
    expenses: result?.data || [],
    total: result?.meta.total || 0,
    isLoading,
    error,
    createCashExpense: createCashMutation.mutate,
    isCreatingCash: createCashMutation.isPending,
    createDigitalExpense: createDigitalMutation.mutate,
    isCreatingDigital: createDigitalMutation.isPending,
    deleteExpense: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}

export const useTodaySummary = () => {
  return useQuery({
    queryKey: ['summary', 'today'],
    queryFn: () => expenseService.getTodaySummary(),
  })
}

export const useWeekSummary = () => {
  return useQuery({
    queryKey: ['summary', 'week'],
    queryFn: () => expenseService.getWeekSummary(),
  })
}

export const useMonthSummary = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['summary', 'month', year, month],
    queryFn: () => expenseService.getMonthSummary(year, month),
  })
}
