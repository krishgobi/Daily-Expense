import React from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title:     string
  subtitle?: string
  action?:   React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, className }) => (
  <div className={cn('flex items-start justify-between gap-4', className)}>
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)
