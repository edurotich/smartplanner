import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const { taxRate, reinvestmentRate } = await request.json();
    const paramsData = await params;
    const projectId = String(paramsData.id);

    // Validate inputs
    if (
      taxRate === undefined || 
      reinvestmentRate === undefined ||
      isNaN(parseFloat(taxRate)) ||
      isNaN(parseFloat(reinvestmentRate))
    ) {
      return NextResponse.json(
        { error: 'Invalid tax rate or reinvestment rate' },
        { status: 400 }
      );
    }

    // Ensure values are in valid range
    const parsedTaxRate = parseFloat(taxRate);
    const parsedReinvestmentRate = parseFloat(reinvestmentRate);
    
    if (parsedTaxRate < 0 || parsedTaxRate > 100 || parsedReinvestmentRate < 0 || parsedReinvestmentRate > 100) {
      return NextResponse.json(
        { error: 'Tax rate and reinvestment rate must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Verify ownership and update project
    const { data, error } = await supabase
      .from('projects')
      .update({
        tax_rate: parsedTaxRate,
        reinvestment_rate: parsedReinvestmentRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating project settings:', error);
      return NextResponse.json(
        { error: 'Failed to update project settings' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Project settings updated successfully',
      project: data
    });
  } catch (error) {
    console.error('Error handling project settings update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}