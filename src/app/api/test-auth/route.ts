import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test basic auth signup
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'test123456789'
    
    console.log('Testing basic auth signup...')
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (error) {
      console.error('Auth signup test error:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Auth signup failed',
        error: error.message,
        suggestion: 'Check Supabase Auth settings in dashboard'
      })
    }
    
    if (!data.user) {
      return NextResponse.json({
        status: 'error',
        message: 'No user returned from signup',
        suggestion: 'Check if email confirmation is required'
      })
    }
    
    // Clean up test user
    try {
      await supabase.auth.admin.deleteUser(data.user.id)
    } catch (cleanupError) {
      console.log('Cleanup error (expected):', cleanupError)
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Auth signup test successful',
      user_id: data.user.id,
      email_confirmed: data.user.email_confirmed_at ? true : false
    })
    
  } catch (error) {
    console.error('Test signup error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
