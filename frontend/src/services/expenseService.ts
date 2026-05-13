import { supabase } from './supabaseClient'

export interface MediaFile {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  uploaded_at: string
}

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
  media?: MediaFile[]
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

/**
 * Ensure a row exists in the `users` table for the current auth user.
 * The expenses/transactions tables have a FK → users.id.
 * When bypassing the backend, we must ensure this row exists first.
 */
async function ensureUserRow(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existing) {
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
    if (insertError && !insertError.message.includes('duplicate')) {
      console.warn('Could not create user row:', insertError.message)
    }
  }

  return user.id
}

// Attach signed media URLs to expenses
async function attachMedia(expenses: Expense[]): Promise<Expense[]> {
  if (!expenses.length) return expenses
  const ids = expenses.map((e) => e.id)
  const { data: mediaRows } = await supabase
    .from('expense_media')
    .select('*')
    .in('expense_id', ids)

  const mediaMap: Record<string, MediaFile[]> = {}
  for (const row of mediaRows || []) {
    if (!mediaMap[row.expense_id]) mediaMap[row.expense_id] = []
    mediaMap[row.expense_id].push({
      id:          row.id,
      file_name:   row.file_name,
      file_type:   row.file_type,
      file_size:   row.file_size,
      file_url:    row.file_url,
      uploaded_at: row.uploaded_at,
    })
  }
  return expenses.map((e) => ({ ...e, media: mediaMap[e.id] || [] }))
}

// ─── service ─────────────────────────────────────────────────────────────────

class ExpenseService {
  async getExpenses(filters?: {
    type?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  }) {
    const userId = await getUserId()
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters?.type)     query = query.eq('type', filters.type)
    if (filters?.dateFrom) query = query.gte('date', filters.dateFrom)
    if (filters?.dateTo)   query = query.lte('date', filters.dateTo)

    const limit  = filters?.limit  ?? 20
    const offset = filters?.offset ?? 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    const expenses = await attachMedia((data || []) as Expense[])
    return {
      data: expenses,
      meta: { total: count ?? 0, limit, offset },
    }
  }

  async getExpense(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    const [withMedia] = await attachMedia([data as Expense])
    return withMedia
  }

  async createCashExpense(
    purpose: string,
    amount: number,
    date: string,
    description?: string,
    location?: string,
  ) {
    const userId = await ensureUserRow()
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id:     userId,
        type:        'CASH',
        purpose,
        amount,
        date,
        description: description || null,
        location:    location    || null,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Expense
  }

  async createDigitalExpense(
    purpose: string,
    amount: number,
    paymentMethod: string,
    date: string,
    description?: string,
    location?: string,
  ) {
    const userId = await ensureUserRow()
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id:        userId,
        type:           'DIGITAL',
        purpose,
        amount,
        payment_method: paymentMethod,
        date,
        description:    description || null,
        location:       location    || null,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Expense
  }

  async updateExpense(id: string, updates: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Expense
  }

  async deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
  }

  // ─── summaries ─────────────────────────────────────────────────────────────

  async getTodaySummary() {
    const userId = await getUserId()
    const today  = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .eq('date', today)
    if (error) throw error
    const total = (data || []).reduce((s, r) => s + Number(r.amount), 0)
    return { date: today, total }
  }

  async getWeekSummary() {
    const userId = await getUserId()
    const from   = new Date()
    from.setDate(from.getDate() - 7)
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', from.toISOString().split('T')[0])
    if (error) throw error
    const total = (data || []).reduce((s, r) => s + Number(r.amount), 0)
    return { total, count: data?.length ?? 0 }
  }

  async getMonthSummary(year?: number, month?: number) {
    const userId = await getUserId()
    const now    = new Date()
    const y      = year  ?? now.getFullYear()
    const m      = month ?? now.getMonth() + 1
    const from   = `${y}-${String(m).padStart(2, '0')}-01`
    const to     = new Date(y, m, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)
    if (error) throw error
    const total = (data || []).reduce((s, r) => s + Number(r.amount), 0)
    return { year: y, month: m, total, count: data?.length ?? 0 }
  }
}

export default new ExpenseService()
