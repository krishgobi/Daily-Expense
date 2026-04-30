import api from './api'

export interface Expense {
  id: string
  user_id: string
  type: 'CASH' | 'DIGITAL'
  purpose: string
  amount: number
  description?: string
  date: string
  location?: string
  payment_method?: string
  created_at: string
  updated_at: string
}

class ExpenseService {
  // Expenses - Cash
  async createCashExpense(
    purpose: string,
    amount: number,
    date: string,
    description?: string,
    location?: string,
  ) {
    const response = await api.post<{ status: string; data: Expense }>('/expenses/cash', {
      purpose,
      amount,
      date,
      description,
      location,
    })
    return response.data.data
  }

  // Expenses - Digital
  async createDigitalExpense(
    purpose: string,
    amount: number,
    paymentMethod: string,
    date: string,
    description?: string,
    location?: string,
  ) {
    const response = await api.post<{ status: string; data: Expense }>('/expenses/digital', {
      purpose,
      amount,
      payment_method: paymentMethod,
      date,
      description,
      location,
    })
    return response.data.data
  }

  async getExpenses(filters?: {
    type?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  }) {
    const response = await api.get<{ 
      status: string; 
      data: Expense[]
      meta: { total: number; limit: number; offset: number }
    }>('/expenses', {
      params: {
        expense_type: filters?.type,
        date_from: filters?.dateFrom,
        date_to: filters?.dateTo,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      },
    })
    return response.data
  }

  async getExpense(id: string) {
    const response = await api.get<{ status: string; data: Expense }>(`/expenses/${id}`)
    return response.data.data
  }

  async updateExpense(id: string, updates: Partial<Expense>) {
    const response = await api.put<{ status: string; data: Expense }>(`/expenses/${id}`, updates)
    return response.data.data
  }

  async deleteExpense(id: string) {
    await api.delete(`/expenses/${id}`)
  }

  // Summaries
  async getTodaySummary() {
    const response = await api.get<{ status: string; data: { date: string; total: number } }>(
      '/expenses/summary/today',
    )
    return response.data.data
  }

  async getWeekSummary() {
    const response = await api.get<{ status: string; data: { total: number; count: number } }>(
      '/expenses/summary/week',
    )
    return response.data.data
  }

  async getMonthSummary(year?: number, month?: number) {
    const response = await api.get<{ 
      status: string; 
      data: { year: number; month: number; total: number; count: number } 
    }>('/expenses/summary/month', {
      params: { year, month },
    })
    return response.data.data
  }
}

export default new ExpenseService()
