import { supabase } from './supabaseClient'

export interface User {
  id:             string
  email:          string
  full_name:      string
  created_at?:    string
  currency_code?: string
  timezone?:      string
}

export interface AuthResponse {
  user:                      User | null
  requiresEmailConfirmation?: boolean
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildUser(authUser: any, profile?: any): User {
  return {
    id:            authUser.id,
    email:         authUser.email ?? '',
    full_name:     profile?.full_name
                     ?? authUser.user_metadata?.full_name
                     ?? 'User',
    created_at:    profile?.created_at,
    currency_code: profile?.currency_code,
    timezone:      profile?.timezone,
  }
}

/** Try to fetch from the `users` table (backend-managed profile). */
async function fetchProfile(userId: string): Promise<any | null> {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name, currency_code, timezone, created_at')
      .eq('id', userId)
      .single()
    return data
  } catch {
    return null
  }
}

// ─── service ─────────────────────────────────────────────────────────────────

class AuthService {
  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email:   email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (error) throw error
    if (!data.user) throw new Error('Signup did not return a user.')

    if (!data.session) {
      return { user: null, requiresEmailConfirmation: true }
    }

    const profile = await fetchProfile(data.user.id)
    const user    = buildUser(data.user, profile)
    localStorage.setItem('user', JSON.stringify(user))
    return { user }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
    if (!data.user) throw new Error('Login did not return a user.')

    const profile = await fetchProfile(data.user.id)
    const user    = buildUser(data.user, profile)
    localStorage.setItem('user', JSON.stringify(user))
    return { user }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error || !authUser) return null

    const profile = await fetchProfile(authUser.id)
    const user    = buildUser(authUser, profile)
    localStorage.setItem('user', JSON.stringify(user))
    return user
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error || !authUser) throw new Error('Not authenticated')

    // Update Supabase Auth metadata
    if (updates.full_name) {
      await supabase.auth.updateUser({ data: { full_name: updates.full_name } })
    }

    // Update the `users` table row
    await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', authUser.id)

    const profile = await fetchProfile(authUser.id)
    const user    = buildUser(authUser, profile ?? updates)
    localStorage.setItem('user', JSON.stringify(user))
    return user
  }

  async logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('user')
  }

  getStoredUser(): User | null {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }
}

export default new AuthService()
