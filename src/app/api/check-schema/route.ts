import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('Checking database schema...')
    
    // Check if users table exists and has correct structure
    const { data: usersSchema, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(0)
    
    if (usersError) {
      return NextResponse.json({
        status: 'schema_missing',
        message: 'Users table not found',
        error: usersError.message,
        solution: 'Please apply the database schema from schema.sql to your Supabase project'
      })
    }
    
    // Check if user_tokens table exists
    const { data: tokensSchema, error: tokensError } = await supabase
      .from('user_tokens')
      .select('*')
      .limit(0)
    
    if (tokensError) {
      return NextResponse.json({
        status: 'schema_incomplete',
        message: 'User tokens table not found',
        error: tokensError.message,
        solution: 'Please apply the complete database schema'
      })
    }
    
    // Check if projects table exists
    const { data: projectsSchema, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(0)
    
    if (projectsError) {
      return NextResponse.json({
        status: 'schema_incomplete',
        message: 'Projects table not found',
        error: projectsError.message
      })
    }
    
    // Test if we can create a test user (this will fail if triggers aren't working)
    const testEmail = `test-schema-${Date.now()}@example.com`
    const { data: testUser, error: testError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456789'
    })
    
    if (testError) {
      return NextResponse.json({
        status: 'auth_error',
        message: 'Auth signup test failed',
        error: testError.message,
        code: testError.status,
        suggestion: 'Check Supabase Auth settings - user registration might be disabled'
      })
    }
    
    // Clean up test user
    if (testUser.user) {
      try {
        // Delete from our tables first
        await supabase
          .from('users')
          .delete()
          .eq('id', testUser.user.id)
        
        await supabase
          .from('user_tokens')
          .delete()
          .eq('user_id', testUser.user.id)
        
        console.log('Test user cleanup completed')
      } catch (cleanupError) {
        console.log('Cleanup error (expected):', cleanupError)
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database schema is properly configured',
      tables: ['users', 'user_tokens', 'projects'],
      auth_test: 'passed',
      test_user_id: testUser.user?.id
    })
    
  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Schema check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
