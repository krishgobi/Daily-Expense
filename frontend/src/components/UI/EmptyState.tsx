import React from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?:     React.ReactNode
  title:     string
  desc?:     string
  action?:   React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, desc, action, className }) => (
  <div className={cn('empty-state', className)}>
    {icon && (
      <div className="empty-icon">
        {icon}
      </div>
    )}
    <p className="empty-title">{title}</p>
    {desc && <p className="empty-desc">{desc}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
)
