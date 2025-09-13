import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Generated OTP for', phone, ':', otpCode)
    
    // For now, just store in memory (in production, use Redis or database)
    // This is a temporary solution while we fix the database
    
    // Send OTP via SMS
    try {
      const wasiliana_url = `${process.env.WASILIANA_BASE_URL}/api/v1/send/sms`
      console.log('Sending OTP SMS to:', phone)
      
      const smsResponse = await fetch(wasiliana_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WASILIANA_API_KEY}`
        },
        body: JSON.stringify({
          recipient: phone,
          message: `SmartPlanner verification code: ${otpCode}`,
          sender_id: process.env.WASILIANA_SENDER_ID || 'SMARTPLAN'
        })
      })

      if (!smsResponse.ok) {
        const smsError = await smsResponse.text()
        console.error('SMS sending failed:', smsError)
        return NextResponse.json(
          { error: 'Failed to send SMS', details: smsError },
          { status: 500 }
        )
      }

      console.log('SMS sent successfully')
      
      return NextResponse.json(
        { 
          message: 'OTP sent successfully!',
          phone: phone,
          debug: { otp_code: otpCode } // Remove in production
        },
        { status: 200 }
      )
      
    } catch (smsError) {
      console.error('SMS API error:', smsError)
      return NextResponse.json(
        { error: 'SMS service error', details: smsError instanceof Error ? smsError.message : 'Unknown' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Simple signup error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
