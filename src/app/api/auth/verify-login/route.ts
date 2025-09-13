import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PhoneAuthService } from '@/lib/phone-auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp_code } = await request.json()
    
    if (!phone || !otp_code) {
      return NextResponse.json(
        { error: 'Phone number and OTP code are required' },
        { status: 400 }
      )
    }

    const adminClient = await createAdminClient()
    
    console.log('Login OTP verification for phone:', phone)
    
    // Step 1: Find user by phone and verify OTP
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, phone, otp_code, otp_expires_at, verified, name')
      .eq('phone', phone)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found or invalid phone number' },
        { status: 404 }
      )
    }

    if (!user.verified) {
      return NextResponse.json(
        { error: 'Account not verified. Please complete signup first.' },
        { status: 400 }
      )
    }

    if (!user.otp_code || user.otp_code !== otp_code) {
      console.error('Invalid login OTP code')
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    // Check if OTP has expired
    if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
      console.error('Login OTP has expired')
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new login OTP.' },
        { status: 400 }
      )
    }

    console.log('Login OTP verified successfully')

    // Step 2: Clear OTP and update last login
    const { error: updateError } = await adminClient
      .from('users')
      .update({ 
        otp_code: null, // Clear OTP code
        otp_expires_at: null, // Clear expiry
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('User login update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete login', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('User login completed successfully')

    // Step 3: Delete any existing sessions for this user (single session per user)
    await PhoneAuthService.deleteAllUserSessions(user.id)

    // Step 4: Create new user session
    const sessionData = await PhoneAuthService.createSession(user.id)
    
    if (!sessionData) {
      console.error('Failed to create user session')
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    console.log('User session created successfully')

    // Step 5: Get current token balance
    const { data: tokenData } = await adminClient
      .from('user_tokens')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    console.log('Login verification completed successfully')
    
    // Create response with session cookie
    const response = NextResponse.json(
      { 
        message: 'Logged in successfully!',
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          verified: true
        },
        session: {
          token: sessionData.token,
          expires_at: sessionData.expires_at
        },
        tokens_remaining: tokenData?.balance || 0
      },
      { status: 200 }
    )

    // Set session cookie on response with explicit debug logging
    console.log('Setting session cookie, token length:', sessionData.token.length)
    try {
      // Set cookie with more permissive settings for development
      response.cookies.set('session-token', sessionData.token, {
        httpOnly: false, // Set to false to allow JavaScript access for debugging
        secure: process.env.NODE_ENV === 'production', // True in production
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/'
      })
      console.log('Cookie set successfully on response object')
    } catch (error) {
      console.error('Error setting cookie:', error)
    }

    // Add a debug header to verify the cookie was set in the response
    response.headers.set('X-Session-Token-Set', 'true')
    response.headers.set('X-Session-Token-Length', sessionData.token.length.toString())

    return response

  } catch (error) {
    console.error('Login OTP verification error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}