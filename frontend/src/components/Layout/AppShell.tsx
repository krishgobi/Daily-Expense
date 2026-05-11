import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Settings, Menu, X } from 'lucide-react'
import logo from '../../assets/logo.svg'
import { useAuth } from '../../context/AuthContext'
import { ChatBot } from '../Chat/ChatBot'

interface AppShellProps {
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Reports', to: '/reports' },
  { label: 'Search', to: '/search' },
  { label: 'Calendar', to: '/calendar' },
]

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/90">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 sm:gap-3 rounded-xl text-left focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700"
            >
              <img src={logo} alt="Tracksy.AI logo" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-contain" />
              <div className="hidden sm:block">
                <p className="text-base sm:text-lg font-semibold tracking-tight text-gray-950 dark:text-gray-100">
                  Tracksy.AI
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">Track expenses smarter</p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-950'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {/* User name - hidden on mobile */}
              <span className="hidden sm:block max-w-32 lg:max-w-48 truncate text-sm text-gray-600 dark:text-gray-300">
                {user?.full_name || user?.email}
              </span>

              {/* Profile button - icon only on mobile */}
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="inline-flex h-9 w-9 sm:h-10 sm:w-auto items-center justify-center sm:gap-2 rounded-xl border border-gray-200 bg-white px-2 sm:px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Profile</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Logout button - hidden on mobile, shown in mobile menu */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden lg:inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 dark:focus:ring-red-950"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-950'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                
                {/* Mobile user info and logout */}
                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {user?.full_name || user?.email}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="inline h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700 z-20">
        <div className="grid grid-cols-6 gap-1 px-2 py-2">
          {navItems.slice(0, 6).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`
              }
            >
              <span className="text-xs sm:text-sm leading-none mb-1">
                {item.label.charAt(0)}
              </span>
              <span className="text-[10px] leading-none hidden sm:block">
                {item.label.length > 8 ? item.label.substring(0, 6) + '...' : item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Add padding to main content on mobile to account for bottom nav */}
      <div className="lg:hidden h-16"></div>
      
      {/* ChatBot Component */}
      <ChatBot />
    </div>
  )
}
