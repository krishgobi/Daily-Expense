import api from './api'

export interface SearchExpense {
  id: string
  purpose: string
  description?: string
  amount: number
  type: 'CASH' | 'DIGITAL'
  date: string
  location?: string
}

export interface SearchTransaction {
  id: string
  person_name: string
  amount: number
  type: 'BORROWED' | 'LENT'
  status: 'PENDING' | 'COMPLETED'
  given_date: string
  expected_return_date?: string
  purpose: string
}

export interface SearchResult {
  expenses: SearchExpense[]
  transactions: SearchTransaction[]
  query: string
}

export interface RecentSearch {
  text: string
  type: 'expense' | 'transaction'
}

class SearchService {
  async searchExpenses(query: string, filters?: {
    expenseType?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  }) {
    const response = await api.get<{
      status: string
      data: {
        expenses: SearchExpense[]
        total: number
        limit: number
        offset: number
        query: string
      }
    }>('/search/expenses', {
      params: {
        q: query,
        expense_type: filters?.expenseType,
        date_from: filters?.dateFrom,
        date_to: filters?.dateTo,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      },
    })
    return response.data.data
  }

  async searchTransactions(query: string, filters?: {
    transactionType?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  }) {
    const response = await api.get<{
      status: string
      data: {
        transactions: SearchTransaction[]
        total: number
        limit: number
        offset: number
        query: string
      }
    }>('/search/transactions', {
      params: {
        q: query,
        transaction_type: filters?.transactionType,
        status: filters?.status,
        date_from: filters?.dateFrom,
        date_to: filters?.dateTo,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      },
    })
    return response.data.data
  }

  async globalSearch(query: string, limit?: number) {
    const response = await api.get<{
      status: string
      data: SearchResult
    }>('/search/global', {
      params: {
        q: query,
        limit: limit || 10,
      },
    })
    return response.data.data
  }

  async getRecentSearches(limit?: number) {
    const response = await api.get<{
      status: string
      data: {
        recent: RecentSearch[]
        limit: number
      }
    }>('/search/recent', {
      params: {
        limit: limit || 5,
      },
    })
    return response.data.data.recent
  }
}

export default new SearchService()
