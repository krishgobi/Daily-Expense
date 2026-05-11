import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import logo from '../../assets/logo.svg'
import { useAuth } from '../../context/AuthContext'

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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/90">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 rounded-xl text-left focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700"
            >
              <img src={logo} alt="Tracksy.AI logo" className="h-10 w-10 rounded-xl object-contain" />
              <div>
                <p className="text-lg font-semibold tracking-tight text-gray-950 dark:text-gray-100">
                  Tracksy.AI
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Track expenses smarter</p>
              </div>
            </button>


          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition ${
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="max-w-48 truncate text-sm text-gray-600 dark:text-gray-300">
              {user?.full_name || user?.email}
            </span>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 dark:focus:ring-red-950"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
