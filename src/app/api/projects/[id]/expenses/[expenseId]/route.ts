import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
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
    const expenseId = String(paramsData.expenseId);

    // Get expense with project verification
    const { data: expense, error } = await adminClient
      .from('expenses')
      .select(`
        *,
        projects!inner(
          id,
          user_id
        )
      `)
      .eq('id', expenseId)
      .eq('project_id', projectId)
      .eq('projects.user_id', userSession.user.id)
      .single();

    if (error) {
      console.error('Error fetching expense:', error);
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Error in expense GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
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
    const expenseId = String(paramsData.expenseId);
    const body = await request.json();
    const { title, category, amount, date } = body;

    // Validate required fields
    if (!title || !category || !amount || !date) {
      return NextResponse.json({ 
        error: 'Title, category, amount, and date are required' 
      }, { status: 400 });
    }

    // Verify ownership and update expense
    const { data: expense, error } = await adminClient
      .from('expenses')
      .update({
        title: title.trim(),
        category: category.trim(),
        amount: parseFloat(amount),
        date: date
      })
      .eq('id', expenseId)
      .eq('project_id', projectId)
      .select(`
        *,
        projects!inner(
          id,
          user_id
        )
      `)
      .single();

    if (error || !expense || expense.projects.user_id !== userSession.user.id) {
      console.error('Error updating expense:', error);
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Expense updated successfully',
      expense 
    });
  } catch (error) {
    console.error('Error in expense PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
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
    const expenseId = String(paramsData.expenseId);

    // First verify project ownership
    const { data: project } = await adminClient
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete expense
    const { error } = await adminClient
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting expense:', error);
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error in expense DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
