import { NextRequest, NextResponse } from 'next/server'
import { PhoneAuthService } from '@/lib/phone-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const allCookies = request.cookies.getAll()
    const sessionToken = request.cookies.get('session-token')?.value
    
    // Get auth headers
    const authHeaders = {
      authorization: request.headers.get('authorization') || 'none',
      cookie: request.headers.get('cookie') || 'none'
    }

    // Attempt to validate session
    let sessionValidation = null
    let userData = null
    
    if (sessionToken) {
      // Get session data
      sessionValidation = await PhoneAuthService.validateSession(sessionToken)
      
      // If session is valid, get user token data
      if (sessionValidation?.user) {
        const adminClient = await createAdminClient()
        const { data } = await adminClient
          .from('user_tokens')
          .select('balance')
          .eq('user_id', sessionValidation.user.id)
          .single()
          
        userData = data
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        count: allCookies.length,
        all: allCookies,
        sessionTokenPresent: !!sessionToken,
        sessionTokenValue: sessionToken ? `${sessionToken.substring(0, 5)}...${sessionToken.substring(sessionToken.length - 5)}` : null
      },
      headers: authHeaders,
      session: {
        valid: !!sessionValidation?.user,
        data: sessionValidation ? {
          id: sessionValidation.id,
          user_id: sessionValidation.user_id,
          expires_at: sessionValidation.expires_at,
          user: sessionValidation.user ? {
            id: sessionValidation.user.id,
            phone: sessionValidation.user.phone,
            // mask the phone for privacy in logs
            phoneObfuscated: sessionValidation.user.phone ? 
              `${sessionValidation.user.phone.substring(0, 3)}****${sessionValidation.user.phone.substring(sessionValidation.user.phone.length - 3)}` : null,
            verified: sessionValidation.user.verified
          } : null
        } : null
      },
      user: {
        tokens: userData?.balance || 0
      }
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      error: 'Error retrieving debug info',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}