import { NextRequest, NextResponse } from 'next/server'

// Generate M-PESA access token
async function getMpesaAccessToken() {
  try {
    // Check if required environment variables are set
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      console.error('Missing M-PESA credentials in environment variables');
      throw new Error('M-PESA credentials not configured');
    }
    
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    console.log('Attempting to get M-PESA access token...');
    
    // Use production URL for real transactions
    const baseUrl = process.env.MPESA_API_ENVIRONMENT === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
      
    const response = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('M-PESA auth failed with status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('M-PESA auth response status:', response.status);
    
    if (!data.access_token) {
      console.error('M-PESA auth response missing token:', data);
      throw new Error('M-PESA response did not include an access token');
    }
    
    console.log('M-PESA access token obtained successfully');
    return data.access_token;
  } catch (error) {
    console.error('M-PESA auth error:', error);
    throw error;
  }
}

// Generate M-PESA password
function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')
  
  return { password, timestamp }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, amount, tokens } = await request.json()
    
    // Better validation with detailed error messages
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }
    
    if (!tokens || isNaN(Number(tokens)) || Number(tokens) <= 0) {
      return NextResponse.json({ error: 'Valid token count is required' }, { status: 400 })
    }

    // Format phone number to ensure it's in the correct format for M-PESA
    let formattedPhone = phone.toString().replace(/\D/g, '') // Remove non-digits
    
    // Ensure it's in the 254XXXXXXXXX format
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1)
    } else if (formattedPhone.length === 9) {
      // Assume it's 7XXXXXXXX (without leading 0)
      formattedPhone = '254' + formattedPhone
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }
    
    // Validate the formatted number
    if (!/^254\d{9}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be a valid Kenyan number.' },
        { status: 400 }
      )
    }

    // Get access token
    let accessToken;
    try {
      accessToken = await getMpesaAccessToken()
      console.log('Access token obtained:', accessToken ? 'Success' : 'Failed')
    } catch (error) {
      console.error('Failed to get M-PESA access token:', error)
      return NextResponse.json(
        { 
          error: 'Failed to authenticate with M-PESA. Please try again later.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
    
    // Check if the environment has all required variables
    if (!process.env.MPESA_SHORTCODE || !process.env.MPESA_PASSKEY) {
      console.error('Missing required M-PESA configuration')
      return NextResponse.json(
        { error: 'M-PESA is not properly configured' },
        { status: 500 }
      )
    }
    
    // Generate password and timestamp
    const { password, timestamp } = generatePassword()
    
    // Debug info
    console.log('Making STK push request with:')
    console.log('- Phone:', formattedPhone)
    console.log('- Amount:', amount)
    console.log('- ShortCode:', process.env.MPESA_SHORTCODE)
    console.log('- CallbackURL:', process.env.MPESA_CALLBACK_URL || 'Not set')
    
    // Only simulate if explicitly configured to do so
    if (process.env.MPESA_SIMULATE === 'true') {
      console.log('Simulation mode: Simulating successful M-PESA response')
      
      // Return a simulated success response
      return NextResponse.json({
        message: 'Payment initiated successfully (SIMULATION MODE)',
        checkoutRequestID: 'ws_CO_' + Date.now(),
        merchantRequestID: 'ws_MR_' + Date.now(),
        responseCode: '0',
        responseDescription: 'Success. Request accepted for processing',
        customerMessage: 'Success. Request accepted for processing',
        testMode: true
      })
    }
    
    // STK Push request for production mode
    try {
      const baseUrl = process.env.MPESA_API_ENVIRONMENT === 'production' 
        ? 'https://api.safaricom.co.ke' 
        : 'https://sandbox.safaricom.co.ke';
        
      const stkResponse = await fetch(
        `${baseUrl}/mpesa/stkpush/v1/processrequest`,
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
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://webhook.site/callback-url',
            AccountReference: 'SmartPlanner Tokens',
            TransactionDesc: `Purchase ${tokens} tokens`,
          }),
        }
      )

      const stkData = await stkResponse.json()
      console.log('M-PESA STK response:', stkData)

      // Check for M-PESA specific error codes in addition to HTTP status
      if (!stkResponse.ok || (stkData.ResponseCode && stkData.ResponseCode !== '0')) {
        console.error('M-PESA API error:', stkData)
        
        let errorMessage = 'Payment initiation failed'
        
        // Extract error message from M-PESA response if available
        if (stkData.errorMessage) {
          errorMessage = stkData.errorMessage
        } else if (stkData.ResponseDescription) {
          errorMessage = stkData.ResponseDescription
        } else if (stkData.errorCode) {
          // Map error codes to user-friendly messages
          const errorCodeMap: Record<string, string> = {
            '400': 'Invalid request to M-PESA',
            '401': 'Authentication failed',
            '403': 'Access forbidden',
            '404': 'M-PESA endpoint not found',
            '500': 'M-PESA service error',
            '1': 'Invalid phone number format',
            '1001': 'Invalid M-PESA account',
            '1002': 'Transaction processing error',
            '1003': 'Insufficient funds',
            '1031': 'Request cancelled by user',
            '1032': 'Invalid amount',
            '1037': 'Unresponsive user phone',
            '404.001.03': 'Invalid M-PESA Access Token',
          }
          
          errorMessage = errorCodeMap[stkData.errorCode] || `M-PESA error code: ${stkData.errorCode}`
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: stkData,
            debug: {
              phone: formattedPhone,
              amount,
              shortCode: process.env.MPESA_SHORTCODE,
              callbackUrl: process.env.MPESA_CALLBACK_URL
            }
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: 'Payment initiated successfully',
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID,
        testMode: false
      })
    } catch (error) {
      console.error('M-PESA STK push error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to connect to M-PESA service',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in STK push:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
