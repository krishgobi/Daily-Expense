import { supabase } from './supabaseClient'

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
  media?: {
    id: string
    file_name: string
    file_path: string
    file_url?: string
    file_type: string
    file_size: number
    uploaded_at: string
  }[]
  created_at: string
  updated_at: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

/**
 * Ensure a row exists in the `users` table for the current auth user.
 * The `users` table has a FK from transactions/expenses → users.id.
 * When using the Supabase JS client directly (bypassing the backend),
 * we must make sure this row exists before inserting child records.
 */
async function ensureUserRow(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Check if row already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existing) {
    // Insert the user row — password_hash is required by the schema,
    // use a placeholder since auth is handled by Supabase Auth
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id:            user.id,
        email:         user.email ?? '',
        password_hash: 'supabase-auth',
        full_name:     user.user_metadata?.full_name ?? user.email ?? 'User',
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      })

    // Ignore duplicate key errors (race condition)
    if (insertError && !insertError.message.includes('duplicate')) {
      console.warn('Could not create user row:', insertError.message)
    }
  }

  return user.id
}

async function attachMedia(transactions: Transaction[]): Promise<Transaction[]> {
  if (!transactions.length) return transactions
  const ids = transactions.map((t) => t.id)
  const { data: mediaRows } = await supabase
    .from('transaction_media')
    .select('*')
    .in('transaction_id', ids)

  const mediaMap: Record<string, any[]> = {}
  for (const row of mediaRows || []) {
    if (!mediaMap[row.transaction_id]) mediaMap[row.transaction_id] = []
    mediaMap[row.transaction_id].push({
      id:          row.id,
      file_name:   row.file_name,
      file_type:   row.file_type,
      file_size:   row.file_size,
      file_url:    row.file_url,
      file_path:   row.file_path,
      uploaded_at: row.uploaded_at,
    })
  }
  return transactions.map((t) => ({ ...t, media: mediaMap[t.id] || [] }))
}

// ─── service ─────────────────────────────────────────────────────────────────

class TransactionService {
  async getTransactions(filters?: {
    type?: 'BORROWED' | 'LENT'
    status?: 'PENDING' | 'COMPLETED'
    personName?: string
    limit?: number
    offset?: number
  }) {
    const userId = await getUserId()
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('given_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters?.type)       query = query.eq('transaction_type', filters.type)
    if (filters?.status)     query = query.eq('status', filters.status)
    if (filters?.personName) query = query.ilike('person_name', `%${filters.personName}%`)

    const limit  = filters?.limit  ?? 20
    const offset = filters?.offset ?? 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    const transactions = await attachMedia((data || []) as Transaction[])
    return {
      data: transactions,
      meta: { total: count ?? 0, limit, offset },
    }
  }

  async getTransaction(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    const [withMedia] = await attachMedia([data as Transaction])
    return withMedia
  }

  async createTransaction(
    transactionType: 'BORROWED' | 'LENT',
    personName: string,
    amount: number,
    givenDate: string,
    expectedReturnDate?: string,
    purpose?: string,
  ) {
    // Ensure the users table row exists before inserting (FK requirement)
    const userId = await ensureUserRow()

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id:              userId,
        transaction_type:     transactionType,
        person_name:          personName,
        amount,
        given_date:           givenDate,
        expected_return_date: expectedReturnDate || null,
        purpose:              purpose            || null,
        status:               'PENDING',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Transaction
  }

  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Transaction
  }

  async completeTransaction(id: string, actualReturnDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status:             'COMPLETED',
        actual_return_date: actualReturnDate,
        updated_at:         new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Transaction
  }

  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async getPendingRepayments() {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'BORROWED')
      .eq('status', 'PENDING')
      .order('expected_return_date', { ascending: true })
    if (error) throw error
    return (data || []) as Transaction[]
  }

  async getPendingCollections() {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'LENT')
      .eq('status', 'PENDING')
      .order('expected_return_date', { ascending: true })
    if (error) throw error
    return (data || []) as Transaction[]
  }

  async getOverdue() {
    const userId = await getUserId()
    const today  = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .lt('expected_return_date', today)
    if (error) throw error
    const rows = (data || []) as Transaction[]
    return {
      overdue_borrowed: rows.filter((t) => t.transaction_type === 'BORROWED'),
      overdue_lent:     rows.filter((t) => t.transaction_type === 'LENT'),
    }
  }

  async getTransactionsSummary() {
    const userId = await getUserId()
    const today  = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('transactions')
      .select('transaction_type, status, amount, expected_return_date')
      .eq('user_id', userId)
    if (error) throw error

    const rows     = data || []
    const borrowed = rows.filter((r) => r.transaction_type === 'BORROWED')
    const lent     = rows.filter((r) => r.transaction_type === 'LENT')
    const sum      = (arr: any[]) => arr.reduce((s, r) => s + Number(r.amount), 0)

    const overdueBorrowed = borrowed.filter(
      (r) => r.status === 'PENDING' && r.expected_return_date && r.expected_return_date < today,
    )
    const overdueLent = lent.filter(
      (r) => r.status === 'PENDING' && r.expected_return_date && r.expected_return_date < today,
    )

    return {
      total_borrowed:          sum(borrowed),
      total_lent:              sum(lent),
      pending_borrowed:        sum(borrowed.filter((r) => r.status === 'PENDING')),
      pending_lent:            sum(lent.filter((r) => r.status === 'PENDING')),
      overdue_borrowed_count:  overdueBorrowed.length,
      overdue_lent_count:      overdueLent.length,
      overdue_borrowed_amount: sum(overdueBorrowed),
      overdue_lent_amount:     sum(overdueLent),
    }
  }
}

export default new TransactionService()
