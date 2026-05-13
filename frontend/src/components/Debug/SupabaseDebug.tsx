/**
 * SupabaseDebug — drop this anywhere in the app to diagnose connection issues.
 * Remove once data is confirmed working.
 * Usage: <SupabaseDebug /> inside any page.
 */
import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabaseClient'

interface Result {
  label:   string
  ok:      boolean
  detail:  string
}

export const SupabaseDebug: React.FC = () => {
  const [results, setResults] = useState<Result[]>([])
  const [running, setRunning] = useState(true)

  useEffect(() => {
    const run = async () => {
      const out: Result[] = []

      // 1. Session
      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      out.push({
        label:  'Auth session',
        ok:     !!session,
        detail: session ? `uid=${session.user.id}` : (sessErr?.message ?? 'No session'),
      })

      if (!session) { setResults(out); setRunning(false); return }

      // 2. expenses
      const { data: exp, error: expErr, count: expCount } = await supabase
        .from('expenses').select('id', { count: 'exact', head: true })
      out.push({
        label:  'expenses table',
        ok:     !expErr,
        detail: expErr ? expErr.message : `${expCount ?? 0} rows visible`,
      })

      // 3. transactions
      const { data: tx, error: txErr, count: txCount } = await supabase
        .from('transactions').select('id', { count: 'exact', head: true })
      out.push({
        label:  'transactions table',
        ok:     !txErr,
        detail: txErr ? txErr.message : `${txCount ?? 0} rows visible`,
      })

      // 4. users
      const { data: usr, error: usrErr } = await supabase
        .from('users').select('id, full_name').eq('id', session.user.id).single()
      out.push({
        label:  'users table (own row)',
        ok:     !usrErr,
        detail: usrErr ? usrErr.message : `full_name="${usr?.full_name}"`,
      })

      setResults(out)
      setRunning(false)
    }
    run()
  }, [])

  return (
    <div className="fixed bottom-24 left-4 z-50 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900 text-xs font-mono">
      <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">🔍 Supabase Debug</p>
      {running && <p className="text-gray-500">Running checks…</p>}
      {results.map((r) => (
        <div key={r.label} className="flex items-start gap-2 mb-1">
          <span>{r.ok ? '✅' : '❌'}</span>
          <div>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{r.label}</span>
            <br />
            <span className={r.ok ? 'text-gray-500' : 'text-red-600 dark:text-red-400'}>{r.detail}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
