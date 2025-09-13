import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()
    
    // Test basic connection
    console.log('Testing Supabase connection...')
    
    // Try to query the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (usersError) {
      console.error('Users table error:', usersError)
      return NextResponse.json({
        status: 'error',
        message: 'Users table not found or accessible',
        error: usersError.message,
        suggestion: 'Please apply the database schema to your Supabase project'
      })
    }
    
    // Try to query the user_tokens table
    const { data: tokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('count')
      .limit(1)
    
    if (tokensError) {
      console.error('User tokens table error:', tokensError)
      return NextResponse.json({
        status: 'error',
        message: 'User tokens table not found',
        error: tokensError.message
      })
    }
    
    // Test auth.users access with admin client
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Auth users error:', authError)
      return NextResponse.json({
        status: 'partial',
        message: 'Database tables exist but auth admin access failed',
        error: authError.message,
        suggestion: 'Check if SUPABASE_SERVICE_ROLE_KEY is correct'
      })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      tables: {
        users: 'accessible',
        user_tokens: 'accessible',
        auth_admin: 'accessible'
      },
      auth_users_count: authUsers.users.length
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
