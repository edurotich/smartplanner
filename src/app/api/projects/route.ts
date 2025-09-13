export async function DELETE(request: NextRequest) {
  try {
    console.log('=== PROJECTS DELETE API ===');
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    console.log('Session token:', sessionToken ? 'Present' : 'Missing');
    if (!sessionToken) {
      console.log('No session token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate session and get user
    console.log('Validating session...');
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid');
    if (!userSession?.user) {
      console.log('Invalid session or no user');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    console.log('User authenticated:', userSession.user.phone);

    // Parse project id from request body
    const body = await request.json();
    const { projectId } = body;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const adminClient = await createAdminClient();
    // Ensure the project belongs to the user
    const { data: project, error: fetchError } = await adminClient
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();
    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (project.user_id !== userSession.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the project
    const { error: deleteError } = await adminClient
      .from('projects')
      .delete()
      .eq('id', projectId);
    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error in projects DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== PROJECTS GET API ===')
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    console.log('Session token:', sessionToken ? `Present (${sessionToken.length} chars)` : 'Missing')
    
    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate session and get user
    console.log('Validating session...')
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid')
    if (!userSession?.user) {
      console.log('Invalid session or no user')
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    console.log('User authenticated:', userSession.user.phone)

    const adminClient = await createAdminClient();

    // Get user's projects
    const { data: projects, error } = await adminClient
      .from('projects')
      .select(`
        *,
        expenses(id, amount),
        income(id, amount)
      `)
      .eq('user_id', userSession.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Calculate totals for each project
    const projectsWithTotals = projects?.map(project => {
      const totalExpenses = project.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
      const totalIncome = project.income?.reduce((sum: number, income: any) => sum + income.amount, 0) || 0;
      const profit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

      return {
        ...project,
        total_expenses: totalExpenses,
        total_income: totalIncome,
        profit,
        profit_margin: profitMargin,
        budget_used: project.boq_budget > 0 ? (totalExpenses / project.boq_budget) * 100 : 0
      };
    });

    return NextResponse.json({ projects: projectsWithTotals });
  } catch (error) {
    console.error('Error in projects GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== PROJECTS POST API ===')
    // Get session token from cookies
    const sessionToken = request.cookies.get('session-token')?.value;
    console.log('Session token:', sessionToken ? 'Present' : 'Missing')
    
    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate session and get user
    console.log('Validating session...')
    const userSession = await PhoneAuthService.validateSession(sessionToken);
    console.log('Session validation result:', userSession ? 'Valid' : 'Invalid')
    if (!userSession?.user) {
      console.log('Invalid session or no user')
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    console.log('User authenticated:', userSession.user.phone)

    const adminClient = await createAdminClient();
    const body = await request.json();
    const { name, description, boq_budget, tax_rate, reinvestment_rate } = body;

    // Validate required fields
    if (!name || !boq_budget) {
      return NextResponse.json({ 
        error: 'Project name and BOQ budget are required' 
      }, { status: 400 });
    }

    // Create project
    const { data: project, error } = await adminClient
      .from('projects')
      .insert({
        user_id: userSession.user.id,
        name: name.trim(),
        description: description?.trim() || '',
        boq_budget: parseFloat(boq_budget),
        tax_rate: parseFloat(tax_rate) || 16.0, // Default VAT rate in Kenya
        reinvestment_rate: parseFloat(reinvestment_rate) || 10.0 // Default 10%
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Project created successfully',
      project: {
        ...project,
        total_expenses: 0,
        total_income: 0,
        profit: 0,
        profit_margin: 0,
        budget_used: 0
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in projects POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
