import { api } from './api'

export interface UserSettings {
  salary_day:      number | null
  whatsapp_number: string | null
  initial_balance: number
}

export interface MonthlyIncome {
  year:                 number
  month:                number
  month_income:         number
  month_expenses:       number
  month_lent_out:       number
  month_lent_returned:  number
  month_savings:        number
  overall_expenses:     number
  lent_pending:         number
  borrowed_pending:     number
  initial_balance:      number
  overall_balance:      number
}

export interface UpdateSettingsPayload {
  salary_day?:      number | null
  whatsapp_number?: string | null
  initial_balance?: number
}

export interface UpdateIncomePayload {
  income?: number | null
}

export interface AdjustIncomePayload {
  amount:     number
  operation:  'add' | 'subtract'
  note?:      string
}

const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const { data } = await api.get<UserSettings>('/settings/')
    return data
  },

  async updateSettings(payload: UpdateSettingsPayload): Promise<void> {
    await api.put('/settings/', payload)
  },

  async getMonthlyIncome(): Promise<MonthlyIncome> {
    const { data } = await api.get<MonthlyIncome>('/settings/income')
    return data
  },

  async updateMonthlyIncome(payload: UpdateIncomePayload): Promise<void> {
    await api.put('/settings/income', payload)
  },

  async adjustIncome(payload: AdjustIncomePayload): Promise<{ income: number }> {
    const { data } = await api.post<{ income: number }>('/settings/income/adjust', payload)
    return data
  },
}

export default settingsService
