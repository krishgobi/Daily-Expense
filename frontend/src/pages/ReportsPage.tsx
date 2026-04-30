import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ReportGenerator } from '../components/Reports/ReportGenerator'
import { ReportList } from '../components/Reports/ReportList'

export const ReportsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">💰 Smart Expense Manager</h1>
              <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
                Dashboard
              </button>
              <button onClick={() => navigate('/analytics')} className="text-gray-600 hover:text-gray-900">
                Analytics
              </button>
              <button onClick={() => navigate('/reports')} className="text-blue-600 font-semibold">
                Reports
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.full_name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ReportGenerator />
          </div>
          <div className="lg:col-span-2">
            <ReportList />
          </div>
        </div>
      </main>
    </div>
  )
}
