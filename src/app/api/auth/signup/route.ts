import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PhoneAuthService } from '@/lib/phone-auth'

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    console.log('Phone signup for:', phone)

    const adminClient = await createAdminClient()
    
    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await adminClient
      .from('users')
      .select('id, phone, verified, name')
      .eq('phone', phone)
      .maybeSingle()

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Error checking existing user:', existingUserError)
      return NextResponse.json(
        { error: 'Database error checking user' },
        { status: 500 }
      )
    }

    if (existingUser) {
      if (existingUser.verified) {
        return NextResponse.json(
          { error: 'User already exists. Please login instead.' },
          { status: 409 }
        )
      } else {
        // User exists but not verified, resend OTP
        console.log('User exists but not verified, resending OTP')
        
        // Generate new OTP
        const otpCode = PhoneAuthService.generateOTP()
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Update user with new OTP
        const { error: updateError } = await adminClient
          .from('users')
          .update({
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt.toISOString(),
            name: name || existingUser.name
          })
          .eq('id', existingUser.id)

        if (updateError) {
          console.error('Error updating user OTP:', updateError)
          return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
          )
        }

        // Send OTP via SMS
        const smsResult = await PhoneAuthService.sendOTP(phone, otpCode, true)
        if (!smsResult.success) {
          console.error('SMS sending failed:', smsResult.error)
          return NextResponse.json(
            { error: 'Failed to send OTP. Please try again.' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: 'Account found! OTP sent to your phone for verification.',
          userId: existingUser.id,
          smsInfo: smsResult.data
        })
      }
    }

    // Create new user
    const otpCode = PhoneAuthService.generateOTP()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const { data: newUser, error: createError } = await adminClient
      .from('users')
      .insert({
        phone,
        name: name || null,
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt.toISOString(),
        verified: false
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user tokens record (5 free tokens)
    const { error: tokenError } = await adminClient
      .from('user_tokens')
      .insert({
        user_id: newUser.id,
        balance: 5
      })

    if (tokenError) {
      console.error('Error creating user tokens:', tokenError)
      // Continue anyway, tokens can be added later
    }

    // Send OTP via SMS
    const smsResult = await PhoneAuthService.sendOTP(phone, otpCode, true)
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error)
      return NextResponse.json(
        { error: 'Account created but failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

    console.log('User created successfully:', newUser.id)
    
    return NextResponse.json({
      message: 'Account created successfully! Check your phone for the OTP.',
      userId: newUser.id,
      smsInfo: smsResult.data
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}