import { supabase } from './supabaseClient'
import api from './api'

export interface User {
  id: string
  email: string
  full_name: string
  created_at?: string
  currency_code?: string
  timezone?: string
}

export interface AuthResponse {
  user: User | null
  requiresEmailConfirmation?: boolean
}

class AuthService {
  /**
   * Fetch user profile from backend API
   * The backend will query the Supabase database using the authenticated user ID from JWT
   */
  private async fetchUserProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/me')
      const userData = response.data.data
      return {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        created_at: userData.created_at,
        currency_code: userData.currency_code,
        timezone: userData.timezone,
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      throw new Error('Could not fetch user profile')
    }
  }

  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedFullName = fullName.trim()

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedFullName,
        },
      },
    })

    if (signUpError) {
      throw signUpError
    }

    const authUser = authData.user
    if (!authUser) {
      throw new Error('Supabase did not return a user for this signup request.')
    }

    if (!authData.session) {
      return {
        user: null,
        requiresEmailConfirmation: true,
      }
    }

    // Fetch user profile from backend (which creates it via trigger if needed)
    let profile
    try {
      profile = await this.fetchUserProfile()
    } catch (error) {
      // Profile creation might be pending if email confirmation is enabled
      profile = {
        id: authUser.id,
        email: authUser.email ?? normalizedEmail,
        full_name: normalizedFullName,
      }
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? normalizedEmail,
      full_name: profile.full_name,
      created_at: profile.created_at,
      currency_code: profile.currency_code,
      timezone: profile.timezone,
    }

    localStorage.setItem('user', JSON.stringify(user))

    return { user }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase()

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (signInError) {
      throw signInError
    }

    const authUser = authData.user
    if (!authUser) {
      throw new Error('Supabase did not return a user for this login request.')
    }

    // Fetch user profile from backend
    let profile
    try {
      profile = await this.fetchUserProfile()
    } catch (error) {
      // If profile fetch fails, use fallback
      profile = {
        id: authUser.id,
        email: authUser.email ?? normalizedEmail,
        full_name:
          typeof authUser.user_metadata?.full_name === 'string' &&
          authUser.user_metadata.full_name.trim()
            ? authUser.user_metadata.full_name.trim()
            : 'New User',
      }
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? normalizedEmail,
      full_name: profile.full_name,
      created_at: profile.created_at,
      currency_code: profile.currency_code,
      timezone: profile.timezone,
    }

    localStorage.setItem('user', JSON.stringify(user))

    return { user }
  }

  async getCurrentUser() {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw authError
    }

    if (!authUser) {
      return null
    }

    // Fetch user profile from backend
    let profile
    try {
      profile = await this.fetchUserProfile()
    } catch (error) {
      // If profile fetch fails, use fallback
      profile = {
        id: authUser.id,
        email: authUser.email ?? '',
        full_name:
          typeof authUser.user_metadata?.full_name === 'string' &&
          authUser.user_metadata.full_name.trim()
            ? authUser.user_metadata.full_name.trim()
            : 'New User',
      }
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: profile.full_name,
      created_at: profile.created_at,
      currency_code: profile.currency_code,
      timezone: profile.timezone,
    }

    localStorage.setItem('user', JSON.stringify(user))

    return user
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw authError
    }

    if (!authUser) {
      throw new Error('You must be signed in to update your profile.')
    }

    // Send update request to backend API
    try {
      const response = await api.put('/auth/profile', updates)
      const updatedProfile = response.data.data

      const user = {
        id: updatedProfile.id,
        email: updatedProfile.email,
        full_name: updatedProfile.full_name,
        created_at: updatedProfile.created_at,
        currency_code: updatedProfile.currency_code,
        timezone: updatedProfile.timezone,
      }

      localStorage.setItem('user', JSON.stringify(user))

      return user
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw new Error('Failed to update profile')
    }
  }

  async logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('user')
  }

  getStoredUser(): User | null {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  async isAuthenticated(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return !!session
  }
}

export default new AuthService()
