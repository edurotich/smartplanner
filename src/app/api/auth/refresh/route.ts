import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== AUTH REFRESH API ===');
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    console.log('Session token:', sessionToken ? `Present (${sessionToken.length} chars)` : 'Missing');
    
    if (!sessionToken) {
      console.log('No session token found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate current session
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid');
    
    if (!userSession?.user) {
      console.log('Invalid session or no user, returning 401');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Refresh the session
    const refreshed = await PhoneAuthService.refreshSession(sessionToken);
    console.log('Session refresh result:', refreshed ? 'Success' : 'Failed');
    
    if (!refreshed) {
      return NextResponse.json({ 
        error: 'Failed to refresh session' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Session refreshed successfully',
      user: {
        id: userSession.user.id,
        phone: userSession.user.phone,
        verified: userSession.user.verified
      },
      expires_at: userSession.expires_at
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}