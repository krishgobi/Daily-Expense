import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService, { User } from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication on mount
  useEffect(() => {
    const storedUser = authService.getStoredUser()
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser)
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      const result = await authService.login(email, password)
      setUser(result.user)
      setIsAuthenticated(true)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Login failed'
      setError(message)
      throw err
    }
  }

  const register = async (email: string, password: string, fullName?: string) => {
    try {
      setError(null)
      const result = await authService.register(email, password, fullName)
      setUser(result.user)
      setIsAuthenticated(true)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Registration failed'
      setError(message)
      throw err
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setError(null)
      const result = await authService.updateProfile(updates)
      setUser(result)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Update failed'
      setError(message)
      throw err
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
