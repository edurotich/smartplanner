import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, verified')
      .eq('phone', phone)
      .single()

    if (existingUser && !existingUser.verified) {
      // Update OTP for unverified user
      await supabase
        .from('users')
        .update({ otp_code: otpCode })
        .eq('phone', phone)
    } else if (existingUser && existingUser.verified) {
      // Check token balance for existing verified user
      const { data: tokens } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', existingUser.id)
        .single()

      if (!tokens || tokens.balance < 1) {
        return NextResponse.json(
          { error: 'Insufficient tokens. Please purchase tokens to login.' },
          { status: 402 }
        )
      }

      // Deduct 1 token and update OTP
      await supabase.rpc('update_user_tokens', {
        user_uuid: existingUser.id,
        token_change: -1
      })

      await supabase
        .from('users')
        .update({ otp_code: otpCode })
        .eq('phone', phone)
    } else {
      // Create new user (first signup is free)
      const { data: newUser, error: createError } = await supabase.auth.signUp({
        email: `${phone}@temp.com`, // Temporary email for Supabase auth
        password: Math.random().toString(36).substring(7), // Random password
        options: {
          data: {
            phone: phone
          }
        }
      })

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      // Update user with OTP
      if (newUser.user) {
        await supabase
          .from('users')
          .update({ otp_code: otpCode, phone: phone })
          .eq('id', newUser.user.id)
      }
    }

    // Send OTP via Wasiliana SMS API
    const wasiliana_url = `${process.env.WASILIANA_BASE_URL}/api/v1/send/sms`
    console.log('Sending SMS to URL:', wasiliana_url)
    
    const smsResponse = await fetch(wasiliana_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WASILIANA_API_KEY}`
      },
      body: JSON.stringify({
        recipient: phone,
        message: `Your SmartPlanner verification code is: ${otpCode}. Valid for 5 minutes.`,
        sender_id: process.env.WASILIANA_SENDER_ID || 'SMARTPLAN'
      })
    })

    if (!smsResponse.ok) {
      const smsError = await smsResponse.text()
      console.error('Failed to send SMS:', smsError)
      // Continue anyway - don't fail the whole process if SMS fails
    } else {
      console.log('SMS sent successfully')
    }

    return NextResponse.json(
      { message: 'OTP sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in send-otp:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
