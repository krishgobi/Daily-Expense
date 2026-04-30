import axios from 'axios'
import { supabase } from './supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

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
    console.error('Failed to get Supabase session for API request:', error)
  }

  return config
})

/**
 * Response interceptor: Handle token expiration
 * When 401 is received, refresh Supabase session and retry request
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Attempt to refresh Supabase session
        const { data, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError || !data.session?.access_token) {
          // Session refresh failed - redirect to login
          localStorage.removeItem('user')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`
        return api(originalRequest)
      } catch (err) {
        // Session refresh failed
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

export default api
