import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('Checking what tables exist...')
    
    const tables = ['users', 'user_tokens', 'projects', 'expenses', 'income', 'payments']
    const results: any = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0)
        
        if (error) {
          results[table] = { exists: false, error: error.message }
        } else {
          results[table] = { exists: true, error: null }
        }
      } catch (err) {
        results[table] = { exists: false, error: 'Unknown error' }
      }
    }
    
    // Also check if we can access auth.users
    let authUsersCount = 0
    try {
      const { count } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
      authUsersCount = count || 0
    } catch (err) {
      console.log('Cannot access auth.users directly (this is normal)')
    }
    
    return NextResponse.json({
      status: 'checked',
      tables: results,
      auth_users_count: authUsersCount,
      message: 'Table existence check completed'
    })
    
  } catch (error) {
    console.error('Table check error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check tables',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
