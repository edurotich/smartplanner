import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate session and get user
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    if (!userSession?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const adminClient = await createAdminClient();
    const paramsData = await params;
    const projectId = String(paramsData.id);
    const { format } = await request.json(); // 'pdf' or 'csv'

    // Check user token balance
    const { data: userTokens, error: tokenError } = await adminClient
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userSession.user.id)
      .single();

    if (tokenError || !userTokens) {
      return NextResponse.json({ error: 'Failed to check token balance' }, { status: 500 });
    }

    if (userTokens.balance < 5) {
      return NextResponse.json({ 
        error: 'Insufficient tokens. 5 tokens required to export data.' 
      }, { status: 402 }); // 402 Payment Required
    }

    // Get project details
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get expenses and income
    const { data: expenses, error: expenseError } = await adminClient
      .from('expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (expenseError) {
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    const { data: income, error: incomeError } = await adminClient
      .from('income')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (incomeError) {
      return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
    }

    // Deduct tokens for the export
    const tokensToDeduct = 5; // Cost to export data
    const { error: updateTokensError } = await adminClient
      .from('user_tokens')
      .update({ 
        balance: userTokens.balance - tokensToDeduct,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userSession.user.id);

    if (updateTokensError) {
      console.error('Error updating tokens:', updateTokensError);
      return NextResponse.json({ error: 'Failed to update token balance' }, { status: 500 });
    }

    // Get the updated token balance
    const { data: updatedTokens } = await adminClient
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userSession.user.id)
      .single();

    const remainingBalance = updatedTokens?.balance || 0;

    // Return the data based on the requested format
    return NextResponse.json({
      message: 'Project data exported successfully',
      data: {
        project,
        expenses,
        income,
        generatedAt: new Date().toISOString(),
        tokensDeducted: tokensToDeduct,
        remainingBalance
      },
      tokensDeducted: tokensToDeduct,
      remainingBalance
    });
  } catch (error) {
    console.error('Error in export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}