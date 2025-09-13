import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG CREATE TEST PROJECT API ===');
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'No session token found' 
      }, { status: 401 });
    }

    // Validate session and get user
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    
    if (!userSession?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Invalid session or no user' 
      }, { status: 401 });
    }
    
    const adminClient = await createAdminClient();
    const testName = `Test Project (${new Date().toLocaleTimeString()})`;

    // Create a test project
    const { data: project, error } = await adminClient
      .from('projects')
      .insert({
        user_id: userSession.user.id,
        name: testName,
        description: 'Created for debugging purposes',
        boq_budget: 50000,
        tax_rate: 16.0,
        reinvestment_rate: 10.0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test project:', error);
      return NextResponse.json({ 
        error: 'Failed to create test project',
        details: error.message
      }, { status: 500 });
    }

    // Add a test expense
    await adminClient
      .from('expenses')
      .insert({
        project_id: project.id,
        title: 'Test Expense',
        category: 'Materials',
        amount: 5000,
        date: new Date().toISOString().split('T')[0]
      });

    // Add test income
    await adminClient
      .from('income')
      .insert({
        project_id: project.id,
        source: 'Client Payment',
        amount: 10000,
        date: new Date().toISOString().split('T')[0]
      });

    return NextResponse.json({
      success: true,
      message: 'Test project created successfully',
      projectId: project.id
    });
  } catch (error) {
    console.error('Error creating test project:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}