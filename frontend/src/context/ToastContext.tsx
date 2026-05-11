import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast } from '../components/UI/Toast'

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const toast: Toast = {
      ...toastData,
      id
    }
    setToasts(prev => [...prev, toast])
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ type: 'success', message, duration })
  }, [showToast])

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ type: 'error', message, duration })
  }, [showToast])

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ type: 'info', message, duration })
  }, [showToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ type: 'warning', message, duration })
  }, [showToast])

  const value: ToastContextType = {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map(toast => (
        <div key={toast.id} className="fixed top-4 right-4 z-50">
          <Toast 
            toast={toast} 
            onRemove={removeToast}
          />
        </div>
      ))}
    </ToastContext.Provider>
  )
}
