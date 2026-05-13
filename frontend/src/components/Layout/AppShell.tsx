import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  FileText,
  Search,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react'
import logo from '../../assets/logo.svg'
import { useAuth } from '../../context/AuthContext'
import { ChatBot } from '../Chat/ChatBot'
import { cn } from '../../lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard',    to: '/',            icon: LayoutDashboard, end: true },
  { label: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
  { label: 'Analytics',    to: '/analytics',   icon: TrendingUp },
  { label: 'Reports',      to: '/reports',     icon: FileText },
  { label: 'Search',       to: '/search',      icon: Search },
  { label: 'Calendar',     to: '/calendar',    icon: CalendarDays },
]

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-surface-muted text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex shrink-0 items-center gap-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <img
              src={logo}
              alt="Tracksy.AI"
              className="h-8 w-8 rounded-xl object-contain"
            />
            <span className="hidden text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:block">
              Tracksy.AI
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Avatar + name */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300/60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-2xs font-bold text-white">
                {initials}
              </span>
              <span className="max-w-28 truncate">{user?.full_name || user?.email}</span>
              <Settings className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
            </button>

            {/* Mobile profile icon */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Profile"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-2xs font-bold text-white">
                {initials}
              </span>
            </button>

            {/* Logout — desktop */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95 animate-slide-down">
            <nav className="mx-auto max-w-7xl px-4 py-3 space-y-0.5">
              {navItems.map(({ label, to, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}

              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
                <button
                  type="button"
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false) }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Profile & Settings
                </button>
                <button
                  type="button"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 pb-24 lg:pb-8">
        {children}
      </main>

      {/* ── Mobile bottom nav ──────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95">
        <div className="grid grid-cols-6 px-1 py-1">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1 text-[10px] font-medium transition',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition',
                    isActive && 'bg-brand-50 dark:bg-brand-950/40',
                  )}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="leading-none">{label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ChatBot */}
      <ChatBot />
    </div>
  )
}
