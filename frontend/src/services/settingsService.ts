import { api } from './api'

export interface UserSettings {
  salary_day: number | null
  whatsapp_number: string | null
}

export interface MonthlyIncome {
  year: number
  month: number
  income: number
  expenses: number
  savings: number
}

export interface UpdateSettingsPayload {
  salary_day?: number | null
  whatsapp_number?: string | null
}

export interface UpdateIncomePayload {
  income: number
  savings?: number | null
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
}

export default settingsService
