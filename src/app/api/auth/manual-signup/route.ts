import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
    const adminClient = await createAdminClient()
    
    console.log('Manual signup for phone:', phone)
    
    // Check if user already exists in our users table
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

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Generated OTP:', otpCode)
    
    // Create a unique email for Supabase auth
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const timestamp = Date.now()
    const uniqueEmail = `sp${cleanPhone}${timestamp}@smartplanner.app`
    const securePassword = `SP_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}!`
    
    console.log('Creating auth user with email:', uniqueEmail)
    
    // Step 1: Create auth user manually using admin client
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: uniqueEmail,
      password: securePassword,
      user_metadata: {
        phone: phone,
        name: name || '',
        signup_method: 'manual_phone'
      },
      email_confirm: true // Auto-confirm email since we use phone verification
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { error: 'Failed to create auth user', details: authError.message },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'No auth user created' },
        { status: 500 }
      )
    }

    console.log('Auth user created:', authUser.user.id)

    // Step 2: Create user profile in our users table
    const { error: userProfileError } = await supabase
      .from('users')
      .insert({ 
        id: authUser.user.id,
        phone: phone, 
        otp_code: otpCode,
        verified: false
      })
    
    if (userProfileError) {
      console.error('User profile creation error:', userProfileError)
      
      // Cleanup: Delete the auth user if profile creation failed
      try {
        await adminClient.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
      
      return NextResponse.json(
        { error: 'Failed to create user profile', details: userProfileError.message },
        { status: 500 }
      )
    }

    console.log('User profile created successfully')

    // Step 3: Create user tokens (5 free tokens)
    const { error: tokensError } = await supabase
      .from('user_tokens')
      .insert({ 
        user_id: authUser.user.id,
        balance: 5
      })
    
    if (tokensError) {
      console.error('Tokens creation error:', tokensError)
      // Continue anyway - tokens can be added later
    } else {
      console.log('User tokens created successfully')
    }

    // Step 4: Send OTP SMS
    try {
      const wasiliana_url = `${process.env.WASILIANA_BASE_URL}/api/v1/send/sms`
      console.log('Sending OTP SMS...')
      
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
        // Continue anyway
      } else {
        console.log('SMS sent successfully')
      }
    } catch (smsError) {
      console.error('SMS API error:', smsError)
    }

    console.log('Manual signup completed successfully')
    return NextResponse.json(
      { 
        message: 'Account created successfully! OTP sent to your phone.',
        userId: authUser.user.id,
        isSignup: true,
        debug: {
          email_used: uniqueEmail,
          otp_code: otpCode // Remove this in production
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
