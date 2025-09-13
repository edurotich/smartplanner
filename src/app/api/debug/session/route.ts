import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG SESSION API ===');
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    console.log('Session token:', sessionToken ? `Present (${sessionToken.length} chars)` : 'Missing');
    
    if (!sessionToken) {
      return NextResponse.json({ 
        session: null,
        message: 'No session token found in cookies',
        allCookies: request.cookies.getAll().map(c => c.name)
      });
    }

    // Validate session and get user
    console.log('Validating session...');
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid');

    if (!userSession?.user) {
      return NextResponse.json({ 
        session: null,
        message: 'Invalid session or no user',
        tokenProvided: sessionToken,
        allCookies: request.cookies.getAll().map(c => c.name)
      });
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

    // Get user's projects
    const { data: projects, error: projectsError } = await adminClient
      .from('projects')
      .select('id')
      .eq('user_id', userSession.user.id);
    
    if (projectsError) {
      console.error('Error fetching project IDs:', projectsError);
    }

    return NextResponse.json({
      session: userSession,
      tokens,
      projectIds: projects?.map(p => p.id) || [],
      message: 'Valid session',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug session:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      serverTime: new Date().toISOString()
    }, { status: 500 });
  }
}