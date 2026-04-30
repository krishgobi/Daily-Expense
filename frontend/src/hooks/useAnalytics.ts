import { useQuery } from '@tanstack/react-query'
import analyticsService from '../services/analyticsService'

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsService.getDashboardOverview(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useSpendingTrend = (months: number = 6) => {
  return useQuery({
    queryKey: ['analytics', 'trend', months],
    queryFn: () => analyticsService.getSpendingTrend(months),
    staleTime: 1000 * 60 * 5,
  })
}

export const useDailyBreakdown = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['analytics', 'daily-breakdown', year, month],
    queryFn: () => analyticsService.getDailyBreakdown(year, month),
    staleTime: 1000 * 60 * 5,
  })
}

export const useTypeBreakdown = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['analytics', 'type-breakdown', year, month],
    queryFn: () => analyticsService.getTypeBreakdown(year, month),
    staleTime: 1000 * 60 * 5,
  })
}

export const usePaymentMethodBreakdown = (year?: number, month?: number) => {
  return useQuery({
    queryKey: ['analytics', 'payment-method-breakdown', year, month],
    queryFn: () => analyticsService.getPaymentMethodBreakdown(year, month),
    staleTime: 1000 * 60 * 5,
  })
}
