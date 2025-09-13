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
    
    console.log('Starting signup process for phone:', phone)
    
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

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Generated OTP:', otpCode)
    
    // Create a more unique email to avoid conflicts
    const uniqueEmail = `user_${phone.replace('+', '')}_${Date.now()}@smartplanner.app`
    console.log('Using email:', uniqueEmail)
    
    // Try direct user creation with admin client
    let { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: uniqueEmail,
      password: `SecurePass_${Math.random().toString(36).substring(2, 15)}`,
      user_metadata: {
        phone: phone,
        name: name || '',
        created_via: 'phone_signup'
      },
      email_confirm: true, // Auto-confirm since we're using phone verification
      phone_confirm: false // We'll handle phone verification ourselves
    })

    if (createError) {
      console.error('Admin createUser error:', createError)
      
      // Fallback to regular signup
      console.log('Trying fallback signup method...')
      const { data: fallbackUser, error: fallbackError } = await supabase.auth.signUp({
        email: uniqueEmail,
        password: `SecurePass_${Math.random().toString(36).substring(2, 15)}`,
        options: {
          data: {
            phone: phone,
            name: name || '',
            created_via: 'phone_signup_fallback'
          }
        }
      })

      if (fallbackError) {
        console.error('Fallback signup error:', fallbackError)
        return NextResponse.json(
          { error: 'Failed to create user account', details: fallbackError.message },
          { status: 500 }
        )
      }

      if (!fallbackUser.user) {
        return NextResponse.json(
          { error: 'Failed to create user account', details: 'No user data returned' },
          { status: 500 }
        )
      }

      console.log('Fallback user created:', fallbackUser.user.id)
      newUser = fallbackUser
    } else {
      console.log('Admin user created successfully:', newUser.user?.id)
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user account', details: 'No user data returned' },
        { status: 500 }
      )
    }

    // Create user profile manually
    console.log('Creating user profile...')
    const { error: insertError } = await adminClient
      .from('users')
      .insert({ 
        id: newUser.user.id,
        phone: phone, 
        otp_code: otpCode,
        verified: false
      })
    
    if (insertError) {
      console.error('Insert user profile error:', insertError)
      
      // Try update instead (in case trigger created it)
      const { error: updateError } = await adminClient
        .from('users')
        .update({ 
          phone: phone, 
          otp_code: otpCode,
          verified: false
        })
        .eq('id', newUser.user.id)
      
      if (updateError) {
        console.error('Update user profile error:', updateError)
        
        // If both fail, it might be a schema issue
        return NextResponse.json(
          { 
            error: 'Database schema error', 
            details: `Insert failed: ${insertError.message}, Update failed: ${updateError.message}`,
            suggestion: 'Please ensure the database schema has been applied correctly'
          },
          { status: 500 }
        )
      } else {
        console.log('User profile updated successfully')
      }
    } else {
      console.log('User profile created successfully')
    }

    // Create user tokens
    console.log('Creating user tokens...')
    const { error: tokenError } = await adminClient
      .from('user_tokens')
      .insert({ 
        user_id: newUser.user.id,
        balance: 5  // 5 free tokens for new users
      })
    
    if (tokenError) {
      console.error('Token creation error:', tokenError)
      
      // Try update if exists
      const { error: tokenUpdateError } = await adminClient
        .from('user_tokens')
        .update({ balance: 5 })
        .eq('user_id', newUser.user.id)
      
      if (tokenUpdateError) {
        console.error('Token update error:', tokenUpdateError)
        // Continue anyway
      } else {
        console.log('User tokens updated successfully')
      }
    } else {
      console.log('User tokens created successfully')
    }

    // Send OTP via SMS
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

    console.log('Signup process completed successfully')
    return NextResponse.json(
      { 
        message: 'Account created successfully! OTP sent to your phone.',
        userId: newUser.user.id,
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
    console.error('Signup process error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
