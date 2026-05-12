import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  className,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 }
}) => {
  return (
    <div className={cn('grid gap-4', className)}>
      {children}
    </div>
  )
}
