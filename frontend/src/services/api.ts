import axios, { AxiosError } from 'axios'
import { supabase } from './supabaseClient'
import { logError } from '../utils/errorHandler'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor: Add Supabase JWT token to Authorization header
 * This token is validated by FastAPI using JWKS endpoint from Supabase
 */
api.interceptors.request.use(async (config) => {
  try {
    // Get current Supabase session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If session exists, add access token to Authorization header
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (error) {
    logError(error, 'Failed to get Supabase session')
  }

  return config
})

/**
 * Response interceptor: Handle API errors and token expiration
 * - Handles 401 by refreshing Supabase session and retrying
 * - Logs all errors for debugging
 * - Provides consistent error handling across app
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // Handle 401 Unauthorized (Token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Attempt to refresh Supabase session
        const { data, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError || !data.session?.access_token) {
          // Session refresh failed - clear storage and redirect to login
          localStorage.removeItem('user')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`
        return api(originalRequest)
      } catch (err) {
        // Session refresh failed
        logError(err, 'Session refresh failed')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(err)
      }
    }

    // Handle 5xx server errors
    if (error.response?.status && error.response.status >= 500) {
      logError(error, `Server Error (${error.response.status})`)
    }

    // Handle network errors
    if (!error.response) {
      logError(error, 'Network Error')
    }

    return Promise.reject(error)
  }
)

export default api
