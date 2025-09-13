import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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
    const projectId = String(params.id);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify project ownership
    const { data: project } = await adminClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Build query
    let query = adminClient
      .from('expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Calculate totals
    const total = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const byCategory = expenses?.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({ 
      expenses,
      summary: {
        total,
        count: expenses?.length || 0,
        byCategory
      }
    });
  } catch (error) {
    console.error('Error in expenses GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const projectId = String(params.id);
    const body = await request.json();
    const { title, category, amount, date } = body;

    // Validate required fields
    if (!title || !category || !amount || !date) {
      return NextResponse.json({ 
        error: 'Title, category, amount, and date are required' 
      }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await adminClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create expense
    const { data: expense, error } = await adminClient
      .from('expenses')
      .insert({
        project_id: projectId,
        title: title.trim(),
        category: category.trim(),
        amount: parseFloat(amount),
        date: date
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Expense created successfully',
      expense 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in expenses POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
