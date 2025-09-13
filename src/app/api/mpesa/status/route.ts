import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PhoneAuthService } from '@/lib/phone-auth'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const transactionId = url.searchParams.get('transactionId')
    
    // Validate the session token
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Validate session and get user
    const userSession = await PhoneAuthService.validateSession(sessionToken)
    if (!userSession?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Check if the payment exists in the database
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .or(`mpesa_receipt.eq.${transactionId},checkout_request_id.eq.${transactionId}`)
      .single()
    
    if (error) {
      console.log('Error finding payment:', error)
      // If no payment is found, we check with M-PESA directly
      
      // Implementation of M-PESA query status API call
      try {
        // Get access token
        const auth = Buffer.from(
          `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64');
        
        const baseUrl = process.env.MPESA_API_ENVIRONMENT === 'production' 
          ? 'https://api.safaricom.co.ke' 
          : 'https://sandbox.safaricom.co.ke';
          
        const tokenResponse = await fetch(
          `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
          {
            method: 'GET',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!tokenResponse.ok) {
          throw new Error(`Failed to get M-PESA access token: ${tokenResponse.status}`);
        }
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // Generate timestamp and password
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(
          `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
        ).toString('base64');
        
        // Query transaction status
        const statusResponse = await fetch(
          `${baseUrl}/mpesa/stkpushquery/v1/query`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              BusinessShortCode: process.env.MPESA_SHORTCODE,
              Password: password,
              Timestamp: timestamp,
              CheckoutRequestID: transactionId,
            }),
          }
        );
        
        const statusData = await statusResponse.json();
        console.log('M-PESA status query response:', statusData);
        
        // Check for success status
        if (statusData.ResultCode === 0) {
          return NextResponse.json({
            status: 'completed',
            message: 'Payment completed successfully',
            data: statusData
          });
        } else {
          return NextResponse.json({
            status: 'pending',
            message: statusData.ResultDesc || 'Payment is still being processed',
            data: statusData
          });
        }
      } catch (error) {
        console.error('Error querying M-PESA status:', error);
        return NextResponse.json({
          status: 'pending',
          message: 'Payment is still being processed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Payment found
    return NextResponse.json({
      status: 'completed',
      payment: {
        amount: payment.amount,
        tokens: payment.tokens_added,
        date: payment.created_at,
        receipt: payment.mpesa_receipt
      }
    })
    
  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}