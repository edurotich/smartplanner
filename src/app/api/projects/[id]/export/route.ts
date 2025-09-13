import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    // Extract projectId from params
    const projectId = String(params.id);
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
        error: 'Insufficient tokens. Export requires 5 tokens.', 
        tokensRequired: 5,
        currentBalance: userTokens.balance 
      }, { status: 402 });
    }

    // Get project with all data
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select(`
        *,
        expenses(
          id,
          title,
          category,
          amount,
          date,
          created_at
        ),
        income(
          id,
          source,
          amount,
          date,
          created_at
        )
      `)
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate financial metrics
    const totalExpenses = project.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
    const totalIncome = project.income?.reduce((sum: number, income: any) => sum + income.amount, 0) || 0;
    const profit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    const budgetUsed = project.boq_budget > 0 ? (totalExpenses / project.boq_budget) * 100 : 0;
    const budgetRemaining = project.boq_budget - totalExpenses;
    
    // Tax calculations
    const taxableIncome = Math.max(0, profit);
    const taxAmount = (taxableIncome * project.tax_rate) / 100;
    const netProfit = profit - taxAmount;
    
    // Reinvestment calculations
    const reinvestmentAmount = (netProfit * project.reinvestment_rate) / 100;
    const finalProfit = netProfit - reinvestmentAmount;

    // Deduct 5 tokens
    const { error: deductError } = await adminClient
      .from('user_tokens')
      .update({ balance: userTokens.balance - 5 })
      .eq('user_id', userSession.user.id);

    if (deductError) {
      console.error('Error deducting tokens:', deductError);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    // Prepare report data
    const reportData = {
      project: {
        ...project,
        total_expenses: totalExpenses,
        total_income: totalIncome,
        profit,
        profit_margin: profitMargin,
        budget_used: budgetUsed,
        budget_remaining: budgetRemaining,
        tax_amount: taxAmount,
        net_profit: netProfit,
        reinvestment_amount: reinvestmentAmount,
        final_profit: finalProfit
      },
      expenses: project.expenses || [],
      income: project.income || [],
      generatedAt: new Date().toISOString(),
      tokensDeducted: 5,
      remainingBalance: userTokens.balance - 5
    };

    return NextResponse.json({ 
      message: `Report data prepared for ${format.toUpperCase()} export`,
      data: reportData,
      tokensDeducted: 5,
      remainingBalance: userTokens.balance - 5
    });

  } catch (error) {
    console.error('Error in export route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
