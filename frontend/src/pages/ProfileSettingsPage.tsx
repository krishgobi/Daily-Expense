import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Camera, CheckCircle2, Loader2, ArrowLeft, User, Mail, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.svg'

export const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName]       = useState(user?.full_name || '')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isSaving, setIsSaving]       = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  useEffect(() => { setFullName(user?.full_name || '') }, [user?.full_name])

  const initials = useMemo(() => {
    const name = fullName.trim() || user?.email || 'U'
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  }, [fullName, user?.email])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Please upload a valid image file.'); return }
    setProfileImage(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!fullName.trim()) { setError('Full name is required.'); return }
    setIsSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim() })
      setSuccess('Profile updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Unable to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate(-1)} className="btn-ghost h-9 gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Tracksy.AI" className="h-6 w-6 rounded-lg object-contain" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profile Settings</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile card */}
          <div className="card overflow-hidden">
            {/* Cover gradient */}
            <div className="h-24 bg-gradient-to-r from-brand-500 to-violet-500" />

            {/* Avatar */}
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gray-100 text-xl font-bold text-gray-700 shadow-card-md dark:border-gray-900 dark:bg-gray-800 dark:text-gray-200">
                    {profileImage
                      ? <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                      : initials
                    }
                  </div>
                  <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 dark:border-gray-900">
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
                  </label>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user?.full_name || 'Your Name'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <div className="alert-error mb-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="alert-success mb-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="font-medium">{success}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="label">Full name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSaving}
                      placeholder="Enter your full name"
                      className="input pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="label">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input pl-10 cursor-not-allowed opacity-60"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed here.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !fullName.trim()}
                  className="btn-primary w-full h-11"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </div>
          </div>

          {/* Account info card */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </span>
              <h3 className="section-title">Account</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                <span className="text-sm text-gray-600 dark:text-gray-400">Account type</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Standard</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                <span className="text-sm text-gray-600 dark:text-gray-400">Authentication</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Supabase</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
