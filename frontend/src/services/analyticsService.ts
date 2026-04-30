import api from './api'

export interface DashboardOverview {
  summary: {
    today: number
    week: number
    month: number
  }
  month: string
  breakdown: {
    categories: CategoryBreakdown[]
    daily: DailyBreakdown[]
    type: TypeBreakdown
    payment_methods: PaymentMethodBreakdown[]
  }
  trends: {
    last_6_months: MonthData[]
    spending_trend: SpendingTrend
  }
  top_categories: TopCategory[]
}

export interface CategoryBreakdown {
  name: string
  icon: string
  color: string
  amount: number
  count: number
  percentage: number
}

export interface DailyBreakdown {
  date: string
  day: string
  amount: number
  count: number
}

export interface TypeBreakdown {
  CASH: { amount: number; count: number; percentage: number }
  DIGITAL: { amount: number; count: number; percentage: number }
}

export interface PaymentMethodBreakdown {
  method: string
  amount: number
  count: number
}

export interface MonthData {
  month: string
  month_short: string
  total: number
  count: number
}

export interface SpendingTrend {
  trend: 'UP' | 'DOWN' | 'STABLE'
  percentage_change: number
  last_month?: number
  previous_average?: number
}

export interface TopCategory {
  name: string
  icon: string
  total: number
  count: number
}

class AnalyticsService {
  async getDashboardOverview() {
    const response = await api.get<{ status: string; data: DashboardOverview }>('/analytics/dashboard')
    return response.data.data
  }

  async getSpendingTrend(months: number = 6) {
    const response = await api.get<{
      status: string
      data: { months: MonthData[]; trend: SpendingTrend }
    }>('/analytics/trends/spending', {
      params: { months },
    })
    return response.data.data
  }

  async getCategoryBreakdown(year?: number, month?: number) {
    const response = await api.get<{ status: string; data: CategoryBreakdown[] }>(
      '/analytics/breakdown/category',
      {
        params: { year, month },
      },
    )
    return response.data.data
  }

  async getDailyBreakdown(year?: number, month?: number) {
    const response = await api.get<{ status: string; data: DailyBreakdown[] }>(
      '/analytics/breakdown/daily',
      {
        params: { year, month },
      },
    )
    return response.data.data
  }

  async getTypeBreakdown(year?: number, month?: number) {
    const response = await api.get<{ status: string; data: TypeBreakdown }>(
      '/analytics/breakdown/type',
      {
        params: { year, month },
      },
    )
    return response.data.data
  }

  async getPaymentMethodBreakdown(year?: number, month?: number) {
    const response = await api.get<{ status: string; data: PaymentMethodBreakdown[] }>(
      '/analytics/breakdown/payment-methods',
      {
        params: { year, month },
      },
    )
    return response.data.data
  }

  async getTopCategories(limit: number = 5) {
    const response = await api.get<{ status: string; data: TopCategory[] }>(
      '/analytics/top-categories',
      {
        params: { limit },
      },
    )
    return response.data.data
  }
}

export default new AnalyticsService()
