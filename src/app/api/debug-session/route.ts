import { NextRequest, NextResponse } from 'next/server'
import { PhoneAuthService } from '@/lib/phone-auth'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG SESSION ENDPOINT ===')
    
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value
    console.log('Session token from cookies:', sessionToken ? 'Present' : 'Missing')
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'No session token',
        allCookies: request.cookies.getAll()
      }, { status: 401 })
    }

    // Try to validate session
    console.log('Attempting to validate session...')
    const userSession = await PhoneAuthService.validateSession(sessionToken)
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid')
    
    if (!userSession) {
      return NextResponse.json({ 
        error: 'Invalid session',
        sessionToken: sessionToken.substring(0, 10) + '...'
      }, { status: 401 })
    }

    return NextResponse.json({
      status: 'authenticated',
      user: userSession.user,
      session: {
        id: userSession.id,
        expires_at: userSession.expires_at
      }
    })

  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({
      error: 'Debug session failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}