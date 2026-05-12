import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { 
  Home, 
  Plus, 
  CreditCard, 
  TrendingUp, 
  BarChart3, 
  Search, 
  User 
} from 'lucide-react'

interface MobileNavigationProps {
  className?: string
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50', className)}>
      <div className="flex justify-around items-center px-2 py-2">
        <Link
          to="/"
          className={cn(
            'flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 transition-colors',
            isActive('/') && 'text-blue-600'
          )}
        >
          <Home className="h-6 w-6 mb-1" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link
          to="/expenses"
          className={cn(
            'flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 transition-colors',
            isActive('/expenses') && 'text-blue-600'
          )}
        >
          <Plus className="h-6 w-6 mb-1" />
          <span className="text-xs mt-1">Add</span>
        </Link>
        
        <Link
          to="/transactions"
          className={cn(
            'flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 transition-colors',
            isActive('/transactions') && 'text-blue-600'
          )}
        >
          <CreditCard className="h-6 w-6 mb-1" />
          <span className="text-xs mt-1">Transactions</span>
        </Link>
        
        <Link
          to="/reports"
          className={cn(
            'flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 transition-colors',
            isActive('/reports') && 'text-blue-600'
          )}
        >
          <BarChart3 className="h-6 w-6 mb-1" />
          <span className="text-xs mt-1">Reports</span>
        </Link>
        
        <Link
          to="/search"
          className={cn(
            'flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 transition-colors',
            isActive('/search') && 'text-blue-600'
          )}
        >
          <Search className="h-6 w-6 mb-1" />
          <span className="text-xs mt-1">Search</span>
        </Link>
        
        <Link
          to="/profile"
          className={cn(
            'flex flex-col items-center p-2 text-gray-600 hover:text-gray-900 transition-colors',
            isActive('/profile') && 'text-blue-600'
          )}
        >
          <User className="h-6 w-6 mb-1" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
