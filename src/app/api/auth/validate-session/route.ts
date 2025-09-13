import { NextRequest, NextResponse } from 'next/server'
import { PhoneAuthService } from '@/lib/phone-auth'

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 400 }
      )
    }

    // Validate session
    const user = await PhoneAuthService.validateSession(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      valid: true,
      user: {
        id: user.user?.id,
        phone: user.user?.phone,
        verified: user.user?.verified
      }
    })

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}