import api from './api'

export interface User {
  id: string
  email: string
  full_name?: string
  currency_code: string
  timezone: string
  created_at: string
  updated_at: string
  last_login?: string
}

export interface AuthResponse {
  user: User
  tokens: {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }
}

class AuthService {
  async register(email: string, password: string, fullName?: string) {
    const response = await api.post<{ status: string; data: AuthResponse }>('/auth/register', {
      email,
      password,
      full_name: fullName,
      currency_code: 'INR',
      timezone: 'Asia/Kolkata',
    })
    
    const { access_token, refresh_token } = response.data.data.tokens
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(response.data.data.user))
    
    return response.data.data
  }

  async login(email: string, password: string) {
    const response = await api.post<{ status: string; data: AuthResponse }>('/auth/login', {
      email,
      password,
    })
    
    const { access_token, refresh_token } = response.data.data.tokens
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(response.data.data.user))
    
    return response.data.data
  }

  async getCurrentUser() {
    const response = await api.get<{ status: string; data: User }>('/auth/me')
    return response.data.data
  }

  async updateProfile(updates: Partial<User>) {
    const response = await api.put<{ status: string; data: User }>('/auth/profile', updates)
    localStorage.setItem('user', JSON.stringify(response.data.data))
    return response.data.data
  }

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  getStoredUser(): User | null {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  }
}

export default new AuthService()
