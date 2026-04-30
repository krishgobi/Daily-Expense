import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService, { User } from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  message: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<boolean>
  logout: () => Promise<void>
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
  const [message, setMessage] = useState<string | null>(null)

  // Check authentication on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const hasSession = await authService.isAuthenticated()

        if (!hasSession) {
          setUser(null)
          setIsAuthenticated(false)
          return
        }

        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        setIsAuthenticated(!!currentUser)
      } catch {
        const storedUser = authService.getStoredUser()
        setUser(storedUser)
        setIsAuthenticated(!!storedUser)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setMessage(null)
      const result = await authService.login(email, password)
      if (!result.user) {
        throw new Error('Login did not return a user.')
      }
      setUser(result.user)
      setIsAuthenticated(true)
    } catch (err: any) {
      const message = err.message || err.response?.data?.detail || 'Login failed'
      setError(message)
      throw err
    }
  }

  const register = async (email: string, password: string, fullName: string) => {
    try {
      setError(null)
      setMessage(null)
      const result = await authService.register(email, password, fullName)
      if (result.requiresEmailConfirmation) {
        setUser(null)
        setIsAuthenticated(false)
        setMessage('Account created. Please confirm your email, then sign in.')
        return false
      }

      if (!result.user) {
        throw new Error('Registration did not return a user.')
      }

      setUser(result.user)
      setIsAuthenticated(true)
      return true
    } catch (err: any) {
      const message = err.message || err.response?.data?.detail || 'Registration failed'
      setError(message)
      throw err
    }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setError(null)
      const result = await authService.updateProfile(updates)
      setUser(result)
    } catch (err: any) {
      const message = err.message || err.response?.data?.detail || 'Update failed'
      setError(message)
      throw err
    }
  }

  const clearError = () => {
    setError(null)
    setMessage(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        message,
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
