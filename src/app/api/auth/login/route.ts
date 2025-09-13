import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PhoneAuthService } from '@/lib/phone-auth'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const adminClient = await createAdminClient()
    
    console.log('Phone login for:', phone)
    
    // Check if user exists and is verified
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id, phone, verified, name')
      .eq('phone', phone)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'No account found with this phone number. Please sign up first.' },
        { status: 404 }
      )
    }

    if (!user.verified) {
      return NextResponse.json(
        { error: 'Account not verified. Please complete signup verification first.' },
        { status: 400 }
      )
    }

    // Check if user has sufficient tokens for login (costs 1 token)
    const { data: tokenData, error: tokenError } = await adminClient
      .from('user_tokens')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData || tokenData.balance < 1) {
      return NextResponse.json(
        { error: 'Insufficient tokens for login. Please purchase tokens to continue.' },
        { status: 402 } // Payment Required
      )
    }

    console.log('User found and has sufficient tokens:', user.id)

    // Deduct 1 token for login
    const tokenDeducted = await PhoneAuthService.deductOTPToken(user.id)
    
    if (!tokenDeducted) {
      return NextResponse.json(
        { error: 'Failed to process login token payment' },
        { status: 500 }
      )
    }

    console.log('Token deducted for login')

    // Generate OTP for login
    const otpCode = PhoneAuthService.generateOTP()
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    
    // Update user with login OTP
    const { error: updateError } = await adminClient
      .from('users')
      .update({ 
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Failed to update login OTP:', updateError)
      
      // Refund the token since OTP update failed
      await adminClient
        .from('user_tokens')
        .update({ 
          balance: tokenData.balance, // Restore original balance
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      return NextResponse.json(
        { error: 'Failed to generate login OTP', details: updateError.message },
        { status: 500 }
      )
    }
    
    // Send OTP SMS
    const smsResult = await PhoneAuthService.sendOTP(phone, otpCode, false)
    
    if (!smsResult.success) {
      // Refund the token since SMS failed
      await adminClient
        .from('user_tokens')
        .update({ 
          balance: tokenData.balance, // Restore original balance
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      console.error('Login SMS sending failed:', smsResult.error)
      return NextResponse.json(
        { error: 'Failed to send login SMS' },
        { status: 500 }
      )
    }

    console.log('Login OTP sent successfully')
    
    return NextResponse.json(
      { 
        message: 'Login OTP sent to your phone! (1 token deducted)',
        userId: user.id,
        phone: user.phone,
        name: user.name,
        next_step: 'verify_login_otp',
        tokens_remaining: tokenData.balance - 1
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Phone login error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}