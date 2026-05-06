/**
 * Global API Error Handler
 * Provides consistent error handling across the application
 */

import { AxiosError } from 'axios'

export interface ApiErrorResponse {
  status: number
  message: string
  detail?: string
  isAuthError: boolean
  isServerError: boolean
}

/**
 * Parse API error into standardized format
 */
export const parseApiError = (error: unknown): ApiErrorResponse => {
  if (error instanceof AxiosError) {
    const status = error.response?.status || 0
    const data = error.response?.data as any

    // Handle 401 Unauthorized
    if (status === 401) {
      return {
        status,
        message: 'Session expired. Please login again.',
        detail: data?.detail || 'Unauthorized',
        isAuthError: true,
        isServerError: false,
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      return {
        status,
        message: 'You do not have permission to perform this action.',
        detail: data?.detail || 'Forbidden',
        isAuthError: false,
        isServerError: false,
      }
    }

    // Handle 404 Not Found
    if (status === 404) {
      return {
        status,
        message: 'The requested resource was not found.',
        detail: data?.detail || 'Not Found',
        isAuthError: false,
        isServerError: false,
      }
    }

    // Handle 422 Validation Error
    if (status === 422) {
      return {
        status,
        message: 'Please check your input and try again.',
        detail: data?.detail || 'Validation error',
        isAuthError: false,
        isServerError: false,
      }
    }

    // Handle 5xx Server Errors
    if (status >= 500) {
      return {
        status,
        message: 'Server error. Please try again later.',
        detail: data?.detail || error.message,
        isAuthError: false,
        isServerError: true,
      }
    }

    // Handle network errors
    if (!error.response) {
      return {
        status: 0,
        message: 'Network error. Please check your connection.',
        detail: error.message,
        isAuthError: false,
        isServerError: false,
      }
    }

    // Generic API error
    return {
      status,
      message: data?.detail || data?.message || 'An error occurred. Please try again.',
      detail: error.message,
      isAuthError: false,
      isServerError: false,
    }
  }

  // Handle non-Axios errors
  return {
    status: 0,
    message: 'An unexpected error occurred.',
    detail: error instanceof Error ? error.message : String(error),
    isAuthError: false,
    isServerError: false,
  }
}

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  const apiError = parseApiError(error)
  return apiError.message
}

/**
 * Check if error is authentication-related
 */
export const isAuthError = (error: unknown): boolean => {
  return parseApiError(error).isAuthError
}

/**
 * Check if error is server-related
 */
export const isServerError = (error: unknown): boolean => {
  return parseApiError(error).isServerError
}

/**
 * Log error for debugging
 */
export const logError = (error: unknown, context?: string): void => {
  const apiError = parseApiError(error)
  console.error(`[${context || 'API Error'}]`, {
    status: apiError.status,
    message: apiError.message,
    detail: apiError.detail,
  })
}
