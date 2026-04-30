import api from './api'

export interface Transaction {
  id: string
  user_id: string
  transaction_type: 'BORROWED' | 'LENT'
  person_name: string
  purpose?: string
  amount: number
  given_date: string
  expected_return_date?: string
  actual_return_date?: string
  status: 'PENDING' | 'COMPLETED'
  created_at: string
  updated_at: string
}

class TransactionService {
  async createTransaction(
    transactionType: 'BORROWED' | 'LENT',
    personName: string,
    amount: number,
    givenDate: string,
    expectedReturnDate?: string,
    purpose?: string,
  ) {
    const response = await api.post<{ status: string; data: Transaction }>('/transactions', {
      transaction_type: transactionType,
      person_name: personName,
      amount,
      given_date: givenDate,
      expected_return_date: expectedReturnDate,
      purpose,
    })
    return response.data.data
  }

  async getTransactions(filters?: {
    type?: 'BORROWED' | 'LENT'
    status?: 'PENDING' | 'COMPLETED'
    personName?: string
    limit?: number
    offset?: number
  }) {
    const response = await api.get<{
      status: string
      data: Transaction[]
      meta: { total: number; limit: number; offset: number }
    }>('/transactions', {
      params: {
        transaction_type: filters?.type,
        status: filters?.status,
        person_name: filters?.personName,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      },
    })
    return response.data
  }

  async getTransaction(id: string) {
    const response = await api.get<{ status: string; data: Transaction }>(`/transactions/${id}`)
    return response.data.data
  }

  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const response = await api.put<{ status: string; data: Transaction }>(`/transactions/${id}`, updates)
    return response.data.data
  }

  async completeTransaction(id: string, actualReturnDate: string) {
    const response = await api.put<{ status: string; data: Transaction }>(
      `/transactions/${id}/complete`,
      { actual_return_date: actualReturnDate },
    )
    return response.data.data
  }

  async deleteTransaction(id: string) {
    await api.delete(`/transactions/${id}`)
  }

  async getPendingRepayments() {
    const response = await api.get<{ status: string; data: Transaction[] }>(
      '/transactions/summary/pending-repayments',
    )
    return response.data.data
  }

  async getPendingCollections() {
    const response = await api.get<{ status: string; data: Transaction[] }>(
      '/transactions/summary/pending-collections',
    )
    return response.data.data
  }

  async getOverdue() {
    const response = await api.get<{
      status: string
      data: { overdue_borrowed: Transaction[]; overdue_lent: Transaction[] }
    }>('/transactions/summary/overdue')
    return response.data.data
  }

  async getTransactionsSummary() {
    const response = await api.get<{
      status: string
      data: {
        total_borrowed: number
        total_lent: number
        pending_borrowed: number
        pending_lent: number
        overdue_borrowed_count: number
        overdue_lent_count: number
        overdue_borrowed_amount: number
        overdue_lent_amount: number
      }
    }>('/transactions/summary/overview')
    return response.data.data
  }
}

export default new TransactionService()
