import { supabase } from './supabaseClient'

export interface User {
  id: string
  email: string
  full_name: string
  created_at?: string
}

export interface AuthResponse {
  user: User | null
  requiresEmailConfirmation?: boolean
}

class AuthService {
  private async findProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data
  }

  private async createProfile(userId: string, fullName: string) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
      })
      .select('id, full_name, created_at')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Profile could not be created.')
    }

    return data
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

    let profile = await this.findProfile(authUser.id)

    if (!profile) {
      profile = await this.createProfile(authUser.id, normalizedFullName)
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? normalizedEmail,
      full_name: profile.full_name,
      created_at: profile.created_at,
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

    let profile = await this.findProfile(authUser.id)

    if (!profile) {
      const fallbackFullName =
        typeof authUser.user_metadata?.full_name === 'string' &&
        authUser.user_metadata.full_name.trim()
          ? authUser.user_metadata.full_name.trim()
          : 'New User'

      profile = await this.createProfile(authUser.id, fallbackFullName)
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? normalizedEmail,
      full_name: profile.full_name,
      created_at: profile.created_at,
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

    let profile = await this.findProfile(authUser.id)

    if (!profile) {
      const fallbackFullName =
        typeof authUser.user_metadata?.full_name === 'string' &&
        authUser.user_metadata.full_name.trim()
          ? authUser.user_metadata.full_name.trim()
          : 'New User'

      profile = await this.createProfile(authUser.id, fallbackFullName)
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: profile.full_name,
      created_at: profile.created_at,
    }

    localStorage.setItem('user', JSON.stringify(user))

    return user
  }

  async updateProfile(updates: Partial<User>) {
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

    const nextFullName = updates.full_name?.trim()

    if (!nextFullName) {
      throw new Error('Full name is required.')
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: nextFullName,
      })
      .eq('id', authUser.id)
      .select('id, full_name, created_at')
      .maybeSingle()

    if (updateError) {
      throw updateError
    }

    let profile = updatedProfile

    if (!profile) {
      const existingProfile = await this.findProfile(authUser.id)
      if (existingProfile) {
        throw new Error('Profile update was blocked. Please apply the profiles update RLS policy.')
      }

      profile = await this.createProfile(authUser.id, nextFullName)
    }

    const user = {
      id: authUser.id,
      email: authUser.email ?? '',
      full_name: profile.full_name,
      created_at: profile.created_at,
    }

    localStorage.setItem('user', JSON.stringify(user))

    return user
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
