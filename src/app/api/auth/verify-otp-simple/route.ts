import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PhoneAuthService } from '@/lib/phone-auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp_code, user_id } = await request.json()
    
    if (!phone || !otp_code) {
      return NextResponse.json(
        { error: 'Phone number and OTP code are required' },
        { status: 400 }
      )
    }

    const adminClient = await createAdminClient()
    
    console.log('OTP verification for phone:', phone, 'with code:', otp_code, 'user_id:', user_id)
    
    // Step 1: Find and verify user by phone and OTP (user_id is optional for backward compatibility)
    let userQuery = adminClient
      .from('users')
      .select('id, phone, otp_code, otp_expires_at, verified, name')
      .eq('phone', phone)
    
    // If user_id is provided, use it for additional verification
    if (user_id) {
      userQuery = userQuery.eq('id', user_id)
    }
    
    const { data: user, error: userError } = await userQuery.single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found or invalid phone number' },
        { status: 404 }
      )
    }

    if (user.verified) {
      return NextResponse.json(
        { error: 'User already verified. Please login instead.' },
        { status: 400 }
      )
    }

    // Step 2: Verify OTP code
    if (!user.otp_code || user.otp_code !== otp_code) {
      console.log('OTP mismatch. Expected:', user.otp_code, 'Received:', otp_code)
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    // Step 3: Check OTP expiration
    if (user.otp_expires_at && new Date(user.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    console.log('OTP verified successfully for user:', user.id)

    // Step 4: Mark user as verified and clear OTP
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        verified: true,
        otp_code: null,
        otp_expires_at: null,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      )
    }

    // Step 5: Create session
    const sessionData = await PhoneAuthService.createSession(user.id)
    
    if (!sessionData) {
      console.error('Failed to create session')
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Step 6: Set session cookie via response headers
    const response = NextResponse.json({
      message: 'Account verified successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        verified: true
      },
      session: {
        token: sessionData.token,
        expires_at: sessionData.expires_at
      }
    })

    // Set the session cookie
    console.log('Setting session cookie in verify-otp-simple, token length:', sessionData.token.length)
    try {
      response.cookies.set('session-token', sessionData.token, {
        httpOnly: false, // Make it accessible to JavaScript for debugging
        secure: false, // Always false for localhost dev
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      })
      console.log('Cookie set successfully on response object in verify-otp-simple')
    } catch (error) {
      console.error('Error setting cookie in verify-otp-simple:', error)
    }

    // Add a debug header to verify the cookie was set
    response.headers.set('X-Session-Token-Set', 'true')
    response.headers.set('X-Session-Token-Length', sessionData.token.length.toString())

    console.log('Session created and cookie set for user:', user.id)

    return response

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}