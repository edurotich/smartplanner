import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG FIX SESSION API ===');
    // Get current session token from cookies to delete it properly
    const sessionToken = request.cookies.get('session-token')?.value;
    
    // Clear session cookie on client side
    const response = NextResponse.json({
      success: true,
      message: 'Session reset successfully. Please log in again.'
    });
    
    // Clear the cookie by setting it with an expired date
    response.cookies.set({
      name: 'session-token',
      value: '',
      expires: new Date(0), // Set to epoch time to expire immediately
      path: '/'
    });
    
    if (sessionToken) {
      // Delete the session from database if token exists
      console.log('Deleting session token from database...');
      await PhoneAuthService.deleteSession(sessionToken);
    }

    return response;
  } catch (error) {
    console.error('Error fixing session:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}