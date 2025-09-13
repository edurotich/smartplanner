import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH ME API ===');
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    console.log('Session token:', sessionToken ? `Present (${sessionToken.length} chars)` : 'Missing');
    
    if (!sessionToken) {
      console.log('No session token found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate session and get user
    console.log('Validating session...');
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid');
    
    if (!userSession?.user) {
      console.log('Invalid session or no user, returning 401');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    console.log('User authenticated:', userSession.user.phone);
    const adminClient = await createAdminClient();

    // Get user's tokens
    const { data: tokens, error: tokensError } = await adminClient
      .from('user_tokens')
      .select('*')
      .eq('user_id', userSession.user.id)
      .single();
    
    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
    }

    // Try to refresh the session to extend expiry
    await PhoneAuthService.refreshSession(sessionToken);

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: userSession.user.id,
        phone: userSession.user.phone,
        name: userSession.user.name,
        verified: userSession.user.verified
      },
      tokens: tokens || null,
      session: {
        expires_at: userSession.expires_at
      }
    });
  } catch (error) {
    console.error('Error in auth/me:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}