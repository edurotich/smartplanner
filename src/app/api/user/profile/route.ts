import { NextRequest, NextResponse } from 'next/server'
import { PhoneAuthService } from '@/lib/phone-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session and get user
    const userSession = await PhoneAuthService.validateSession(sessionToken)
    if (!userSession?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    // Get user's token balance
    const { data: tokenData } = await adminClient
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userSession.user.id)
      .single()

    return NextResponse.json({
      phone: userSession.user.phone,
      name: userSession.user.name || '',
      tokens: tokenData?.balance || 0
    })

  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}