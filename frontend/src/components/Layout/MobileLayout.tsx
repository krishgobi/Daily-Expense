import React from 'react'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  rightAction?: React.ReactNode
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  title, 
  showBackButton = true, 
  rightAction 
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button
                className="p-2 -ml-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => window.history.back()}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7 7 0 0l-6-6" />
                </svg>
              </button>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-gray-900">
                {title}
              </h1>
            )}
          </div>
          {rightAction && (
            <div className="flex items-center">
              {rightAction}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Content */}
      <main className="flex-1 pb-16 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around">
          <button className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-900">
            <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18a9 9 9 0 0l-6-6" />
            </svg>
            <span className="mt-1 text-xs">Home</span>
          </button>
          
          <button className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-900">
            <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h7a4 4 4 0 0l-6-6" />
            </svg>
            <span className="mt-1 text-xs">Expenses</span>
          </button>
          
          <button className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-900">
            <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 4 0 0l-6-6" />
            </svg>
            <span className="mt-1 text-xs">Reports</span>
          </button>
          
          <button className="flex flex-col items-center p-2 text-blue-600">
            <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v5a4 4 4 0 0l-6-6" />
            </svg>
            <span className="mt-1 text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
