import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp_code, user_id } = await request.json()
    
    if (!phone || !otp_code || !user_id) {
      return NextResponse.json(
        { error: 'Phone number, OTP code, and user ID are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = await createAdminClient()
    
    console.log('OTP verification for phone:', phone, 'with code:', otp_code, 'user_id:', user_id)
    
    // Debug: Check what users exist (using admin client to bypass RLS)
    const { data: allUsers, error: allUsersError } = await adminClient
      .from('users')
      .select('id, phone, otp_code, verified')
      .eq('phone', phone)
    
    console.log('All users with this phone:', allUsers)
    console.log('Users query error:', allUsersError)
    
    // Step 1: Verify OTP in our users table (using admin client)
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, phone, otp_code, verified')
      .eq('id', user_id)
      .eq('phone', phone)
      .single()

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

    if (user.otp_code !== otp_code) {
      console.error('Invalid OTP code')
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    console.log('OTP verified successfully')

    // Step 2: Create Supabase auth user now that phone is verified
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const timestamp = Date.now()
    const uniqueEmail = `user${cleanPhone}@smartplanner.app` // Simplified email format
    const securePassword = `SP_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}!`
    
    console.log('Creating Supabase auth user with email:', uniqueEmail)
    console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    try {
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: uniqueEmail,
        password: securePassword,
        user_metadata: {
          phone: phone,
          verified_phone: true,
          signup_method: 'phone_otp'
        },
        email_confirm: true // Auto-confirm since we verified via phone
      })

      let finalAuthUser = authUser

      if (authError) {
        console.error('Auth user creation error:', authError)
        console.error('Auth error details:', JSON.stringify(authError, null, 2))
        
        // Try a simpler approach - create without metadata first
        console.log('Trying simpler user creation...')
        const { data: simpleAuthUser, error: simpleAuthError } = await adminClient.auth.admin.createUser({
          email: uniqueEmail,
          password: securePassword,
          email_confirm: true
        })
        
        if (simpleAuthError) {
          console.error('Simple auth user creation also failed:', simpleAuthError)
          return NextResponse.json(
            { error: 'Failed to create authenticated user', details: authError.message || 'Database error creating new user' },
            { status: 500 }
          )
        } else {
          console.log('Simple auth user created successfully:', simpleAuthUser.user?.id)
          finalAuthUser = simpleAuthUser
        }
      }
          
      if (!finalAuthUser?.user) {
        return NextResponse.json(
          { error: 'No auth user created' },
          { status: 500 }
        )
      }
      
      console.log('Auth user created:', finalAuthUser.user.id)
      
      // Step 3: Update user profile with auth user ID and mark as verified
      const { error: updateError } = await adminClient
        .from('users')
        .update({ 
          id: finalAuthUser.user.id, // Update to use Supabase auth user ID
          verified: true,
          otp_code: null // Clear OTP code
        })
        .eq('id', user_id) // Where temp ID matches
      
      if (updateError) {
        console.error('User profile update error:', updateError)
        
        // Cleanup: Delete the auth user if profile update failed
        try {
          await adminClient.auth.admin.deleteUser(finalAuthUser.user.id)
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError)
        }
        
        return NextResponse.json(
          { error: 'Failed to update user profile', details: updateError.message },
          { status: 500 }
        )
      }
      
      // Step 4: Update user tokens with new auth user ID
      const { error: tokenUpdateError } = await adminClient
        .from('user_tokens')
        .update({ user_id: finalAuthUser.user.id })
        .eq('user_id', user_id)
      
      if (tokenUpdateError) {
        console.error('Token update error:', tokenUpdateError)
        // Continue anyway - tokens can be fixed later
      }
      
      console.log('OTP verification completed successfully')
      
      // Step 5: Create session for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: uniqueEmail,
        password: securePassword
      })

      if (sessionError) {
        console.error('Session creation error:', sessionError)
        // User is created but can't auto-login
        return NextResponse.json(
          { 
            message: 'Account verified successfully! Please login with your phone number.',
            userId: finalAuthUser.user.id,
            verified: true,
            warning: 'Auto-login failed, please login manually'
          },
          { status: 201 }
        )
      }

      return NextResponse.json(
        { 
          message: 'Account verified and logged in successfully!',
          userId: finalAuthUser.user.id,
          verified: true,
          session: sessionData.session ? {
            access_token: sessionData.session.access_token,
            expires_at: sessionData.session.expires_at
          } : null
        },
        { status: 200 }
      )

    } catch (createError) {
      console.error('Auth user creation exception:', createError)
      return NextResponse.json(
        { error: 'Failed to create authenticated user', details: createError instanceof Error ? createError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}