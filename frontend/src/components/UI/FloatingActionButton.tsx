import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FloatingActionButtonProps {
  onClick: () => void
  icon?: React.ReactNode
  className?: string
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  icon = <Plus className="h-6 w-6" />, 
  className,
  position = 'bottom-right' 
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 active:scale-95',
        'bottom-6 right-6', // Default bottom-right position
        'bottom-6 right-6 sm:bottom-6 sm:right-6', // Small screens
        'bottom-6 right-6 md:bottom-6 md:right-6', // Medium screens
        'bottom-6 right-6 lg:bottom-6 lg:right-6', // Large screens
        position === 'bottom-center' && 'bottom-6 left-1/2 right-1/2 transform -translate-x-1/2',
        position === 'bottom-left' && 'bottom-6 left-6 right-6 sm:bottom-6 sm:left-6', // Small screens with left position
        className
      )}
      aria-label="Add expense"
    >
      {icon}
    </button>
  )
}
