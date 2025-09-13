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
    
    console.log('Phone-based signup for:', phone)
    
    // Check if user already exists in our users table (use admin client to bypass RLS)
    console.log('Checking for existing user...')
    const { data: existingUser, error: existingUserError } = await adminClient
      .from('users')
      .select('id, phone, verified')
      .eq('phone', phone)
      .maybeSingle() // Use maybeSingle instead of single to avoid error when no user found

    console.log('Existing user check result:', { existingUser, existingUserError })

    if (existingUserError) {
      console.error('Error checking existing user:', existingUserError)
      return NextResponse.json(
        { error: 'Database error checking user', details: existingUserError.message },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('User already exists:', existingUser.id, 'verified:', existingUser.verified)
      
      if (existingUser.verified) {
        console.log('User is already verified - redirecting to login')
        return NextResponse.json(
          { error: 'User with this phone number already exists and is verified. Please login instead.' },
          { status: 409 }
        )
      } else {
        // User exists but not verified - resend OTP
        console.log('User exists but not verified - resending OTP')
        
        // Generate new OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        console.log('Generated new OTP for existing user:', otpCode)
        
        // Update existing user with new OTP
        const { error: updateError } = await adminClient
          .from('users')
          .update({ otp_code: otpCode })
          .eq('id', existingUser.id)
        
        if (updateError) {
          console.error('Failed to update OTP:', updateError)
          return NextResponse.json(
            { error: 'Failed to resend OTP', details: updateError.message },
            { status: 500 }
          )
        }
        
        // Send new OTP SMS
        try {
          const wasiliana_url = `${process.env.WASILIANA_BASE_URL}/api/v1/send/sms`
          console.log('Resending OTP SMS via Wasiliana...')
          
          const smsResponse = await fetch(wasiliana_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ApiKey': process.env.WASILIANA_API_KEY || ''
            },
            body: JSON.stringify({
              recipients: [phone],
              message: `SmartPlanner verification code: ${otpCode}. Complete your signup!`,
              from: process.env.WASILIANA_SENDER_ID || 'SMARTPLAN'
            })
          })

          if (!smsResponse.ok) {
            const smsError = await smsResponse.text()
            console.error('SMS resending failed:', smsError)
            return NextResponse.json(
              { error: 'Failed to resend verification SMS', details: smsError },
              { status: 500 }
            )
          } else {
            console.log('OTP SMS resent successfully')
          }
        } catch (smsError) {
          console.error('SMS API error:', smsError)
          return NextResponse.json(
            { error: 'SMS service error', details: smsError instanceof Error ? smsError.message : 'Unknown' },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { 
            message: 'New OTP sent to your phone!',
            userId: existingUser.id,
            phone: phone,
            isSignup: false,
            next_step: 'verify_otp',
            debug: {
              otp_code: otpCode // Remove this in production
            }
          },
          { status: 200 }
        )
      }
    }

    console.log('No existing user found - creating new user')
    
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Generated OTP:', otpCode)
    
    // Create a temporary unique ID for the user (we'll use this until they verify)
    const tempUserId = crypto.randomUUID()
    
    console.log('Creating user profile with temp ID:', tempUserId)
    
    // Step 1: Create user profile in our users table (unverified) - use admin client
    const { error: userProfileError } = await adminClient
      .from('users')
      .insert({ 
        id: tempUserId,
        phone: phone, 
        otp_code: otpCode,
        verified: false
      })
    
    if (userProfileError) {
      console.error('User profile creation error:', userProfileError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: userProfileError.message },
        { status: 500 }
      )
    }

    console.log('User profile created successfully')

    // Step 2: Create user tokens (5 free tokens for signup) - use admin client
    const { error: tokensError } = await adminClient
      .from('user_tokens')
      .insert({ 
        user_id: tempUserId,
        balance: 5
      })
    
    if (tokensError) {
      console.error('Tokens creation error:', tokensError)
      // Continue anyway - tokens can be added later
    } else {
      console.log('User tokens created successfully')
    }

    // Step 3: Send OTP SMS via Wasiliana
    try {
      const wasiliana_url = `${process.env.WASILIANA_BASE_URL}/api/v1/send/sms`
      console.log('Sending OTP SMS via Wasiliana...')
      
      const smsResponse = await fetch(wasiliana_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': process.env.WASILIANA_API_KEY || ''
        },
        body: JSON.stringify({
          recipients: [phone],
          message: `Welcome to SmartPlanner! Your verification code is: ${otpCode}. This signup is FREE!`,
          from: process.env.WASILIANA_SENDER_ID || 'SMARTPLAN'
        })
      })

      if (!smsResponse.ok) {
        const smsError = await smsResponse.text()
        console.error('SMS sending failed:', smsError)
        
        // Cleanup: Remove the user profile if SMS failed
        await adminClient
          .from('users')
          .delete()
          .eq('id', tempUserId)
        
        return NextResponse.json(
          { error: 'Failed to send verification SMS', details: smsError },
          { status: 500 }
        )
      } else {
        console.log('SMS sent successfully')
      }
    } catch (smsError) {
      console.error('SMS API error:', smsError)
      
      // Cleanup: Remove the user profile if SMS failed
      await adminClient
        .from('users')
        .delete()
        .eq('id', tempUserId)
      
      return NextResponse.json(
        { error: 'SMS service error', details: smsError instanceof Error ? smsError.message : 'Unknown' },
        { status: 500 }
      )
    }

    console.log('Phone-based signup completed successfully')
    return NextResponse.json(
      { 
        message: 'Account created successfully! OTP sent to your phone.',
        userId: tempUserId,
        phone: phone,
        isSignup: true,
        next_step: 'verify_otp',
        debug: {
          otp_code: otpCode // Remove this in production
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Phone signup error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}