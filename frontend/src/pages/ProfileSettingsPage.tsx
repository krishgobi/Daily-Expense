import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Camera, CheckCircle2, Loader2 } from 'lucide-react'
import logo from '../assets/logo.svg'
import { useAuth } from '../context/AuthContext'

export const ProfileSettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const initials = useMemo(() => {
    const name = fullName.trim() || user?.email || 'U'
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [fullName, user?.email])

  useEffect(() => {
    setFullName(user?.full_name || '')
  }, [user?.full_name])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }

    setProfileImage(URL.createObjectURL(file))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

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
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg items-center">
        <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/60 transition-colors dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/30 sm:p-8">
          <header className="mb-8 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img src={logo} alt="Tracksy.AI logo" className="h-11 w-11 rounded-xl object-contain" />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  Tracksy.AI
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track expenses smarter</p>
              </div>
            </div>
          </header>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Profile settings
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
              Manage your account details and profile image.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 text-lg font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {profileImage ? (
                  <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              <label className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-100 focus-within:ring-4 focus-within:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus-within:ring-gray-700">
                <Camera
                  className="h-4 w-4 text-gray-500 transition group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100"
                  aria-hidden="true"
                />
                Replace image
                <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={isSaving}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-gray-800/60 ${
                  error && !fullName.trim()
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-700 dark:focus:ring-red-950'
                    : 'border-gray-200 focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:focus:border-gray-300 dark:focus:ring-gray-700'
                }`}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 shadow-sm outline-none dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving || !fullName.trim()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white dark:focus:ring-gray-700 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSaving ? 'Saving changes...' : 'Save changes'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
