import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    console.log('Starting manual signup process for phone:', phone)
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, phone, verified')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      console.log('User already exists:', existingUser.id)
      return NextResponse.json(
        { error: 'User with this phone number already exists. Please login instead.' },
        { status: 409 }
      )
    }

    // Generate unique identifiers
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const timestamp = Date.now()
    const userId = crypto.randomUUID()
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log('Generated user ID:', userId)
    console.log('Generated OTP:', otpCode)

    // Step 1: Create user profile directly in our users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        phone: phone,
        otp_code: otpCode,
        verified: false
      })

    if (userError) {
      console.error('Failed to create user profile:', userError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: userError.message },
        { status: 500 }
      )
    }

    console.log('User profile created successfully')

    // Step 2: Create user tokens record
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .insert({
        user_id: userId,
        balance: 5  // 5 free tokens for new users
      })

    if (tokenError) {
      console.error('Failed to create user tokens:', tokenError)
      // Continue anyway - we can add tokens later
    } else {
      console.log('User tokens created successfully')
    }

    // Step 3: Create auth user (without relying on triggers)
    const uniqueEmail = `user${cleanPhone}${timestamp}@smartplanner.app`
    
    // Try to create auth user with our predetermined UUID
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: uniqueEmail,
      password: `SecurePass${Math.random().toString(36).substring(2, 15)}!`,
      options: {
        data: {
          phone: phone,
          name: name || '',
          signup_method: 'manual',
          user_id: userId // Pass our predetermined ID
        }
      }
    })

    if (authError) {
      console.error('Auth signup failed:', authError)
      
      // Clean up the user profile we created
      await supabase.from('users').delete().eq('id', userId)
      await supabase.from('user_tokens').delete().eq('user_id', userId)
      
      return NextResponse.json(
        { error: 'Authentication setup failed', details: authError.message },
        { status: 500 }
      )
    }

    console.log('Auth user created:', authUser.user?.id)

    // Step 4: Send OTP via SMS
    console.log('Sending OTP SMS...')
    const wasiliana_url = `${process.env.WASILIANA_BASE_URL}/api/v1/send/sms`
    
    try {
      const smsResponse = await fetch(wasiliana_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WASILIANA_API_KEY}`
        },
        body: JSON.stringify({
          recipient: phone,
          message: `Welcome to SmartPlanner! Your verification code is: ${otpCode}. This signup is FREE!`,
          sender_id: process.env.WASILIANA_SENDER_ID || 'SMARTPLAN'
        })
      })

      if (!smsResponse.ok) {
        const smsError = await smsResponse.text()
        console.error('SMS sending failed:', smsError)
        // Continue anyway - user can request resend
      } else {
        console.log('SMS sent successfully')
      }
    } catch (smsError) {
      console.error('SMS API error:', smsError)
      // Continue anyway
    }

    console.log('Manual signup process completed successfully')
    return NextResponse.json(
      { 
        message: 'Account created successfully! OTP sent to your phone.',
        userId: userId,
        authUserId: authUser.user?.id,
        isSignup: true,
        debug: {
          phone: phone,
          email_used: uniqueEmail,
          otp_code: otpCode // Remove this in production!
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Manual signup error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
