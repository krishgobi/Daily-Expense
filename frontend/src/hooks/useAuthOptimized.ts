import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import authService from '../services/authService'

export interface User {
  id: string
  email: string
  full_name: string
  created_at?: string
  currency_code?: string
  timezone?: string
}

export const useAuthOptimized = () => {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        // First check Supabase session
        const { data: sessionData } = await supabase.auth.getSession()
        
        if (!sessionData?.session?.user) {
          return null
        }

        // Then fetch user profile from backend
        const userProfile = await authService.getCurrentUser()
        return userProfile
      } catch (error) {
        console.error('Auth error:', error)
        return null
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('auth')) return false
      return failureCount < 2
    },
  })

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
    refetch,
  }
}
