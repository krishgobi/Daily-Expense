import { QueryClient, QueryClientConfig } from '@tanstack/react-query'

// React Query configuration for expense tracking app
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache queries for 5 minutes by default
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3, // Retry up to 3 times
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchOnReconnect: true, // Refetch when internet reconnects
    },
    mutations: {
      retry: 2, // Retry up to 2 times
    },
  },
}

// Create and export the query client
export const queryClient = new QueryClient(queryClientConfig)

// React Query hooks for expenses
export const expenseKeys = {
  all: 'expenses',
  lists: (filters: any) => ['expenses', 'lists', filters],
  detail: (id: string) => ['expenses', 'detail', id],
  summary: {
    today: 'expenses-summary-today',
    week: 'expenses-summary-week',
    month: 'expenses-summary-month',
  },
  categories: 'categories',
}

// React Query hooks for transactions
export const transactionKeys = {
  all: 'transactions',
  lists: (filters: any) => ['transactions', 'lists', filters],
  detail: (id: string) => ['transactions', 'detail', id],
  summary: {
    pending: 'transactions-summary-pending',
    completed: 'transactions-summary-completed',
  },
}

// React Query hooks for analytics
export const analyticsKeys = {
  dashboard: 'analytics-dashboard',
  spending: 'analytics-spending',
  trends: 'analytics-trends',
  reports: 'analytics-reports',
}

// Query invalidation keys
export const queryInvalidation = {
  invalidateExpenses: () => [expenseKeys.all, expenseKeys.lists()],
  invalidateExpenseDetail: (id: string) => [expenseKeys.detail(id)],
  invalidateExpensesSummary: () => [
    expenseKeys.summary.today,
    expenseKeys.summary.week,
    expenseKeys.summary.month,
  ],
  invalidateTransactions: () => [transactionKeys.all, transactionKeys.lists()],
  invalidateTransactionDetail: (id: string) => [transactionKeys.detail(id)],
  invalidateTransactionsSummary: () => [
    transactionKeys.summary.pending,
    transactionKeys.summary.completed,
  ],
  invalidateAnalytics: () => [
    analyticsKeys.dashboard,
    analyticsKeys.spending,
    analyticsKeys.trends,
    analyticsKeys.reports,
  ],
  invalidateAll: () => [
    ...Object.values(expenseKeys),
    ...Object.values(transactionKeys),
    ...Object.values(analyticsKeys),
  ],
}
