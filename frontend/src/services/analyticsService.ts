import api from './api'

export interface DashboardOverview {
  summary: {
    today: number
    week: number
    month: number
  }
  month: string
  breakdown: {
    daily: DailyBreakdown[]
    type: TypeBreakdown
    payment_methods: PaymentMethodBreakdown[]
  }
  trends: {
    last_6_months: MonthData[]
    spending_trend: SpendingTrend
  }
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

}

export default new AnalyticsService()
