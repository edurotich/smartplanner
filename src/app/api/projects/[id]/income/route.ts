import { createAdminClient } from '@/lib/supabase/server';
import { PhoneAuthService } from '@/lib/phone-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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
    // Extract projectId from params properly, ensure it's a string
    const paramsData = await params;
    const projectId = String(paramsData.id);
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
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
      .from('income')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    // Apply filters
    if (source) {
      query = query.eq('source', source);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: income, error } = await query;

    if (error) {
      console.error('Error fetching income:', error);
      return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
    }

    // Calculate totals
    const total = income?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
    const bySource = income?.reduce((acc: Record<string, number>, item: any) => {
      acc[item.source] = (acc[item.source] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({ 
      income,
      summary: {
        total,
        count: income?.length || 0,
        bySource
      }
    });
  } catch (error) {
    console.error('Error in income GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await request.json();
    const { source, amount, date } = body;

    // Validate required fields
    if (!source || !amount || !date) {
      return NextResponse.json({ 
        error: 'Source, amount, and date are required' 
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

    // Create income
    const { data: income, error } = await adminClient
      .from('income')
      .insert({
        project_id: projectId,
        source: source.trim(),
        amount: parseFloat(amount),
        date
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating income:', error);
      return NextResponse.json({ error: 'Failed to create income' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Income created successfully',
      income 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in income POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}