import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; incomeId: string } }
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
    const incomeId = String(params.incomeId);

    // Get income with project verification
    const { data: income, error } = await adminClient
      .from('income')
      .select(`
        *,
        projects!inner(
          id,
          user_id
        )
      `)
      .eq('id', incomeId)
      .eq('project_id', projectId)
      .eq('projects.user_id', userSession.user.id)
      .single();

    if (error) {
      console.error('Error fetching income:', error);
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }

    return NextResponse.json({ income });
  } catch (error) {
    console.error('Error in income GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; incomeId: string } }
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
    const incomeId = String(params.incomeId);
    const body = await request.json();
    const { source, amount, date } = body;

    // Validate required fields
    if (!source || !amount || !date) {
      return NextResponse.json({ 
        error: 'Source, amount, and date are required' 
      }, { status: 400 });
    }

    // Verify ownership and update income
    const { data: income, error } = await adminClient
      .from('income')
      .update({
        source: source.trim(),
        amount: parseFloat(amount),
        date: date
      })
      .eq('id', incomeId)
      .eq('project_id', projectId)
      .select(`
        *,
        projects!inner(
          id,
          user_id
        )
      `)
      .single();

    if (error || !income || income.projects.user_id !== userSession.user.id) {
      console.error('Error updating income:', error);
      return NextResponse.json({ error: 'Failed to update income' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Income updated successfully',
      income 
    });
  } catch (error) {
    console.error('Error in income PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; incomeId: string } }
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
    const incomeId = String(params.incomeId);

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

    // Delete income
    const { error } = await adminClient
      .from('income')
      .delete()
      .eq('id', incomeId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting income:', error);
      return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Income deleted successfully' 
    });
  } catch (error) {
    console.error('Error in income DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
