import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import analyticsService from '../services/analyticsService'

export const useDashboardOverview = () => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['analytics', 'dashboard', user?.id],
    queryFn:  () => analyticsService.getDashboardOverview(),
    enabled:  !!user?.id,
    staleTime: 1000 * 60 * 2,
  })
}

export const useSpendingTrend = (months: number = 6) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['analytics', 'trend', months, user?.id],
    queryFn:  () => analyticsService.getSpendingTrend(months),
    enabled:  !!user?.id,
    staleTime: 1000 * 60 * 2,
  })
}

export const useDailyBreakdown = (year?: number, month?: number) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['analytics', 'daily-breakdown', year, month, user?.id],
    queryFn:  () => analyticsService.getDailyBreakdown(year, month),
    enabled:  !!user?.id,
    staleTime: 1000 * 60 * 2,
  })
}

export const useTypeBreakdown = (year?: number, month?: number) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['analytics', 'type-breakdown', year, month, user?.id],
    queryFn:  () => analyticsService.getTypeBreakdown(year, month),
    enabled:  !!user?.id,
    staleTime: 1000 * 60 * 2,
  })
}

export const usePaymentMethodBreakdown = (year?: number, month?: number) => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['analytics', 'payment-method-breakdown', year, month, user?.id],
    queryFn:  () => analyticsService.getPaymentMethodBreakdown(year, month),
    enabled:  !!user?.id,
    staleTime: 1000 * 60 * 2,
  })
}
