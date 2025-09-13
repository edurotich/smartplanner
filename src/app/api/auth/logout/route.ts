import { NextRequest, NextResponse } from 'next/server'
import { PhoneAuthService } from '@/lib/phone-auth'

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value

    if (sessionToken) {
      // Delete the session from database
      await PhoneAuthService.deleteSession(sessionToken)
    }

    // Create response and clear the session cookie
    const response = NextResponse.json({ message: 'Logged out successfully' })
    
    // Clear the session cookie
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: false, // Always false for localhost dev
      sameSite: 'lax',
      maxAge: 0, // Immediately expire the cookie
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    // Even if there's an error, clear the cookie and return success
    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: false, // Always false for localhost dev
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  }
}
