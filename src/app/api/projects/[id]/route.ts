import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== GET PROJECT DETAILS API ===');
    const paramsData = await params;
    const projectId = String(paramsData.id);
    console.log('Project ID:', projectId);
    
    // Log all cookies to debug
    console.log('All cookies:', request.cookies.getAll().map(c => c.name));
    
    const sessionToken = request.cookies.get('session-token')?.value;
    console.log('Session token:', sessionToken ? `Present (${sessionToken.length} chars)` : 'Missing');
    
    if (!sessionToken) {
      console.log('No session token found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSession = await PhoneAuthService.validateSession(sessionToken);
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid');
    if (!userSession?.user) {
      console.log('Invalid session or no user, returning 401');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    console.log('User ID from session:', userSession.user.id);

    const adminClient = await createAdminClient();

    const { data: project, error } = await adminClient
      .from('projects')
      .select(`
        *,
        expenses (*),
        income (*)
      `)
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('Project found:', project.name);
    
    // Calculate summary stats
    const expenses = project.expenses || [];
    const income = project.income || [];
    
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const totalIncome = income.reduce((sum: number, inc: any) => sum + inc.amount, 0);
    
    const profit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
    
    const budgetUsed = project.boq_budget > 0 ? (totalExpenses / project.boq_budget) * 100 : 0;
    const budgetRemaining = project.boq_budget > 0 ? project.boq_budget - totalExpenses : 0;
    
    // Calculate tax and reinvestment
    const taxAmount = profit > 0 ? (profit * project.tax_rate / 100) : 0;
    const netProfit = profit - taxAmount;
    const reinvestmentAmount = netProfit > 0 ? (netProfit * project.reinvestment_rate / 100) : 0;
    const finalProfit = netProfit - reinvestmentAmount;

    return NextResponse.json({
      ...project,
      total_expenses: totalExpenses,
      total_income: totalIncome,
      profit: profit,
      profit_margin: profitMargin,
      budget_used: budgetUsed,
      budget_remaining: budgetRemaining,
      tax_amount: taxAmount,
      net_profit: netProfit,
      reinvestment_amount: reinvestmentAmount,
      final_profit: finalProfit
    });

  } catch (error) {
    console.error('Error in GET /api/projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    const projectId = String(paramsData.id);
    
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSession = await PhoneAuthService.validateSession(sessionToken);
    if (!userSession?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { name, description, boqBudget, taxRate, reinvestmentRate } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const adminClient = await createAdminClient();

    // Verify project ownership
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the project
    const { data, error } = await adminClient
      .from('projects')
      .update({
        name,
        description,
        boq_budget: parseFloat(boqBudget),
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error handling project update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsData = await params;
    const projectId = String(paramsData.id);
    
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSession = await PhoneAuthService.validateSession(sessionToken);
    if (!userSession?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const adminClient = await createAdminClient();

    // Verify project ownership
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the project (this should cascade to expenses and income with Supabase RLS)
    const { error } = await adminClient
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error handling project deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}